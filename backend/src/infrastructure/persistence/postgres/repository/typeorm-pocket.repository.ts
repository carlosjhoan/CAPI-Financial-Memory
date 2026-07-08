import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Pocket } from "../../../../domain/entities/pocket.entity";
import { Income } from "../../../../domain/entities/income.entity";
import { Expense } from "../../../../domain/entities/expense.entity";
import { PocketTransfer } from "../../../../domain/entities/pocket-transfer.entity";
import { PocketRepository } from "../../../../domain/repositories/pocket.repository";
import { PocketEntity } from "../entities/pocket.entity";
import { IncomeAllocationEntity } from "../entities/income-allocation.entity";
import { IncomeEntity } from "../entities/income.entity";
import { ExpenseAllocationEntity } from "../entities/expense-allocation.entity";
import { ExpenseEntity } from "../entities/expense.entity";
import { PocketTransferEntity } from "../entities/pocket-transfer.entity";

@Injectable()
export class TypeOrmPocketRepository implements PocketRepository {
  constructor(
    @InjectRepository(PocketEntity)
    private readonly pocketRepository: Repository<PocketEntity>,
    @InjectRepository(IncomeAllocationEntity)
    private readonly incomeAllocationRepository: Repository<IncomeAllocationEntity>,
    @InjectRepository(ExpenseAllocationEntity)
    private readonly expenseAllocationRepository: Repository<ExpenseAllocationEntity>,
    @InjectRepository(PocketTransferEntity)
    private readonly pocketTransferRepository: Repository<PocketTransferEntity>,
  ) {}

  private toDomain(entity: PocketEntity): Pocket {
    const pocket = new Pocket(
      entity.name,
      entity.type as "goal" | "deposit",
      Number(entity.goal),
      0,
      entity.motivation,
      entity.id,
    );
    pocket.createdAt = entity.createdAt;
    pocket.updatedAt = entity.updatedAt;
    return pocket;
  }

  private toEntity(domain: Pocket): PocketEntity {
    const entity = new PocketEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.userId = domain.userId;
    entity.name = domain.name;
    entity.type = domain.type;
    entity.goal = domain.goal;
    entity.motivation = domain.motivation;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }

  private async computeAccumulatedBatch(pocketIds: string[]): Promise<Map<string, number>> {
    if (pocketIds.length === 0) return new Map();

    const rows = await this.pocketRepository.query(
      `
      SELECT
        pocket_id,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)
        + COALESCE(SUM(CASE WHEN type = 'transfer_in' THEN amount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN type = 'transfer_out' THEN amount ELSE 0 END), 0) AS accumulated
      FROM (
        SELECT ia."pocketId"::text AS pocket_id, ia.amount, 'income' AS type
        FROM income_allocations ia
        WHERE ia."pocketId"::text = ANY($1)
        UNION ALL
        SELECT ea."pocketId"::text, ea.amount, 'expense'
        FROM expense_allocations ea
        WHERE ea."pocketId"::text = ANY($1)
        UNION ALL
        SELECT pt."targetPocketId"::text, pt.amount, 'transfer_in'
        FROM pocket_transfers pt
        WHERE pt."targetPocketId"::text = ANY($1)
        UNION ALL
        SELECT pt."sourcePocketId"::text, pt.amount, 'transfer_out'
        FROM pocket_transfers pt
        WHERE pt."sourcePocketId"::text = ANY($1)
      ) sub
      GROUP BY pocket_id
      `,
      [pocketIds],
    );

    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.pocket_id, parseFloat(row.accumulated || "0"));
    }
    return map;
  }

  async save(pocket: Pocket): Promise<Pocket> {
    const entity = this.toEntity(pocket);
    const savedEntity = await this.pocketRepository.save(entity);
    return this.toDomain(savedEntity);
  }

  async findById(id: string, userId?: string): Promise<Pocket | null> {
    const where: any = { id };
    if (userId) where.userId = userId;
    const entity = await this.pocketRepository.findOne({ where });
    if (!entity) return null;
    const pocket = this.toDomain(entity);
    pocket.accumulatedAmount = await this.computeAccumulated(id);
    return pocket;
  }

  async findByName(name: string, userId: string): Promise<Pocket | null> {
    const entity = await this.pocketRepository.findOne({
      where: { name, userId },
    });
    if (!entity) return null;
    const pocket = this.toDomain(entity);
    pocket.accumulatedAmount = await this.computeAccumulated(pocket.id);
    return pocket;
  }

  async findAll(userId: string): Promise<Pocket[]> {
    const entities = await this.pocketRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
    const pockets = entities.map((entity) => this.toDomain(entity));

    const pocketIds = pockets.map((p) => p.id);
    if (pocketIds.length > 0) {
      // Compute accumulated for all pockets in one query
      const accumulatedMap = await this.computeAccumulatedBatch(pocketIds);
      pockets.forEach((p) => {
        p.accumulatedAmount = accumulatedMap.get(p.id) ?? 0;
      });

      // Obtener últimos incomes asociados a cada pocket
      // Usamos ia.amount (lo que realmente se asignó a este pocket), no i.amount
      const lastIncomeRows = await this.pocketRepository.query(
        `
        SELECT i.id, ia.amount, i.reason, i.date, i."createdAt", i."userId", ia."pocketId"
        FROM incomes i
        JOIN income_allocations ia ON ia."incomeId" = i.id
        WHERE ia."pocketId"::text = ANY($1)
        ORDER BY i.date DESC
      `,
        [pocketIds],
      );

      // Agrupar por pocketId
      const incomesByPocket = new Map<string, Income[]>();
      lastIncomeRows.forEach((row: any) => {
        const pid = row.pocketId;
        if (!incomesByPocket.has(pid)) {
          incomesByPocket.set(pid, []);
        }
        const arr = incomesByPocket.get(pid)!;
        if (arr.length < 7) {
          const income = new Income(
            Number(row.amount),
            row.reason,
            row.date,
            row.id,
            row.userId,
          );
          income.createdAt = row.createdAt;
          arr.push(income);
        }
      });

      // Asignar a cada pocket
      pockets.forEach((p) => {
        p.incomes = incomesByPocket.get(p.id) ?? [];
      });

      // ── Transferencias ──────────────────────────────────────────────
      const allTransfers = await this.pocketTransferRepository
        .createQueryBuilder("transfer")
        .where("transfer.sourcePocketId IN (:...pocketIds)", { pocketIds })
        .orWhere("transfer.targetPocketId IN (:...pocketIds)", { pocketIds })
        .orderBy("transfer.date", "DESC")
        .getMany();

      const transfersByPocket = new Map<string, any[]>();
      allTransfers.forEach((t) => {
        const domain = this.transferToDomain(t);

        // Para el pocket origen → outgoing (skip if pocket was deleted)
        if (t.sourcePocketId) {
          if (!transfersByPocket.has(t.sourcePocketId)) {
            transfersByPocket.set(t.sourcePocketId, []);
          }
          transfersByPocket.get(t.sourcePocketId)!.push({
            ...domain,
            direction: "outgoing",
          });
        }

        // Para el pocket destino → incoming (skip if pocket was deleted)
        if (t.targetPocketId) {
          if (!transfersByPocket.has(t.targetPocketId)) {
            transfersByPocket.set(t.targetPocketId, []);
          }
          transfersByPocket.get(t.targetPocketId)!.push({
            ...domain,
            direction: "incoming",
          });
        }
      });

      pockets.forEach((p) => {
        (p as any).transfers = transfersByPocket.get(p.id) ?? [];
      });
    }

    return pockets;
  }

  async update(pocket: Pocket): Promise<Pocket> {
    const entity = this.toEntity(pocket);
    const updatedEntity = await this.pocketRepository.save(entity);
    return this.toDomain(updatedEntity);
  }

  async delete(id: string, userId?: string): Promise<void> {
    // Nullify transfer records referencing this pocket (preserve financial history)
    await this.pocketTransferRepository.update(
      { sourcePocketId: id },
      { sourcePocketId: null },
    );
    await this.pocketTransferRepository.update(
      { targetPocketId: id },
      { targetPocketId: null },
    );
    // Nullify income_allocations referencing this pocket
    await this.incomeAllocationRepository.update(
      { pocketId: id },
      { pocketId: null },
    );
    const where: any = { id };
    if (userId) where.userId = userId;
    await this.pocketRepository.delete(where);
  }

  async getSummary(
    userId: string,
  ): Promise<{ totalAccumulated: number; totalGoal: number; count: number }> {
    const [countResult, goalResult, accumResult] = await Promise.all([
      this.pocketRepository.query(
        `SELECT COUNT(id) AS count FROM pockets WHERE "userId" = $1`,
        [userId],
      ),
      this.pocketRepository.query(
        `SELECT COALESCE(SUM(goal), 0) AS total_goal FROM pockets WHERE "userId" = $1`,
        [userId],
      ),
      this.pocketRepository.query(
        `
        SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)
          - COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)
          + COALESCE(SUM(CASE WHEN type = 'transfer_in' THEN amount ELSE 0 END), 0)
          - COALESCE(SUM(CASE WHEN type = 'transfer_out' THEN amount ELSE 0 END), 0) AS total_accumulated
        FROM (
          SELECT ia.amount, 'income' AS type
          FROM income_allocations ia
          JOIN pockets p ON p.id::text = ia."pocketId"::text
          WHERE p."userId" = $1
          UNION ALL
          SELECT ea.amount, 'expense'
          FROM expense_allocations ea
          JOIN pockets p ON p.id::text = ea."pocketId"::text
          WHERE p."userId" = $1
          UNION ALL
          SELECT pt.amount, 'transfer_in'
          FROM pocket_transfers pt
          JOIN pockets p ON p.id::text = pt."targetPocketId"::text
          WHERE p."userId" = $1
          UNION ALL
          SELECT pt.amount, 'transfer_out'
          FROM pocket_transfers pt
          JOIN pockets p ON p.id::text = pt."sourcePocketId"::text
          WHERE p."userId" = $1
        ) sub
        `,
        [userId],
      ),
    ]);

    return {
      totalAccumulated: parseFloat(accumResult[0]?.total_accumulated || "0"),
      totalGoal: parseFloat(goalResult[0]?.total_goal || "0"),
      count: parseInt(countResult[0]?.count || "0", 10),
    };
  }

  async findExpensesByPocketId(pocketId: string): Promise<Expense[]> {
    const allocations = await this.expenseAllocationRepository.find({
      where: { pocketId },
      relations: ["expense"],
    });

    return allocations.map((allocation) =>
      this.expenseToDomain(allocation.expense),
    );
  }

  async findIncomesByPocketId(pocketId: string): Promise<Income[]> {
    const allocations = await this.incomeAllocationRepository.find({
      where: { pocketId },
      relations: ["income"],
    });
    // Usamos a.amount (lo asignado a este pocket), no a.income.amount
    return allocations.map((a) => {
      const income = new Income(
        Number(a.amount),
        a.income.reason,
        a.income.date,
        a.income.id,
        a.income.userId,
      );
      income.createdAt = a.income.createdAt;
      return income;
    });
  }

  private incomeToDomain(entity: IncomeEntity): Income {
    const income = new Income(
      Number(entity.amount),
      entity.reason,
      entity.date,
      entity.id,
      entity.userId,
    );
    income.createdAt = entity.createdAt;
    return income;
  }

  private expenseToDomain(entity: ExpenseEntity): Expense {
    const expense = new Expense(
      Number(entity.amount),
      entity.reason,
      entity.date,
      entity.id,
    );
    expense.createdAt = entity.createdAt;
    return expense;
  }

  private transferToDomain(entity: PocketTransferEntity): PocketTransfer {
    const transfer = new PocketTransfer(
      entity.sourcePocketId,
      entity.targetPocketId,
      Number(entity.amount),
      entity.reason,
      entity.date,
      entity.id,
    );
    transfer.createdAt = entity.createdAt;
    return transfer;
  }

  private transferToEntity(domain: PocketTransfer): PocketTransferEntity {
    const entity = new PocketTransferEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.sourcePocketId = domain.sourcePocketId;
    entity.targetPocketId = domain.targetPocketId;
    entity.amount = domain.amount;
    entity.reason = domain.reason;
    entity.date = domain.date;
    entity.createdAt = domain.createdAt;
    return entity;
  }

  async findTransfersByPocketId(pocketId: string): Promise<PocketTransfer[]> {
    const entities = await this.pocketTransferRepository.find({
      where: [{ sourcePocketId: pocketId }, { targetPocketId: pocketId }],
      order: { date: "DESC" },
    });
    return entities.map((e) => this.transferToDomain(e));
  }

  async findHistoryByPocketId(
    pocketId: string,
    options: { page: number; limit: number },
  ): Promise<{ items: any[]; total: number }> {
    const { page, limit } = options;
    const offset = (page - 1) * limit;

    const unionQuery = `
      SELECT id, type, amount, date, "createdAt",
             reason, direction, "sourcePocketId", "targetPocketId",
             "sourcePocketName", "targetPocketName"
      FROM (
        SELECT
          e.id,
          'expense' AS type,
          ea.amount,
          e.date,
          e."createdAt",
          e.reason,
          NULL::text AS direction,
          NULL::uuid AS "sourcePocketId",
          NULL::uuid AS "targetPocketId",
          NULL::text AS "sourcePocketName",
          NULL::text AS "targetPocketName",
          e.date AS sort_date,
          e."createdAt" AS sort_created
        FROM expenses e
        JOIN expense_allocations ea ON ea."expenseId" = e.id
        WHERE ea."pocketId"::text = $1

        UNION ALL

        SELECT
          i.id,
          'income' AS type,
          ia.amount,
          i.date,
          i."createdAt",
          i.reason,
          NULL::text AS direction,
          NULL::uuid AS "sourcePocketId",
          NULL::uuid AS "targetPocketId",
          NULL::text AS "sourcePocketName",
          NULL::text AS "targetPocketName",
          i.date AS sort_date,
          i."createdAt" AS sort_created
        FROM incomes i
        JOIN income_allocations ia ON ia."incomeId" = i.id
        WHERE ia."pocketId"::text = $1

        UNION ALL

        SELECT
          pt.id,
          'transfer' AS type,
          pt.amount,
          pt.date,
          pt."createdAt",
          pt.reason,
          CASE WHEN pt."targetPocketId"::text = $1 THEN 'incoming' ELSE 'outgoing' END AS direction,
          pt."sourcePocketId",
          pt."targetPocketId",
          pt."sourcePocketName",
          pt."targetPocketName",
          pt.date AS sort_date,
          pt."createdAt" AS sort_created
        FROM pocket_transfers pt
        WHERE pt."sourcePocketId"::text = $1 OR pt."targetPocketId"::text = $1
      ) unified
      ORDER BY sort_date DESC, sort_created DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*) AS total FROM (
        SELECT e.id FROM expenses e
          JOIN expense_allocations ea ON ea."expenseId" = e.id
          WHERE ea."pocketId"::text = $1
        UNION ALL
        SELECT i.id FROM incomes i
          JOIN income_allocations ia ON ia."incomeId" = i.id
          WHERE ia."pocketId"::text = $1
        UNION ALL
        SELECT id FROM pocket_transfers
          WHERE "sourcePocketId"::text = $1 OR "targetPocketId"::text = $1
      ) all_ids
    `;

    const items = await this.pocketRepository.query(unionQuery, [
      pocketId,
      limit,
      offset,
    ]);
    const countResult = await this.pocketRepository.query(countQuery, [
      pocketId,
    ]);
    const total = parseInt(countResult[0]?.total || "0", 10);

    return { items, total };
  }

  async computeAccumulated(pocketId: string): Promise<number> {
    const result = await this.pocketRepository.query(
      `
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)
        + COALESCE(SUM(CASE WHEN type = 'transfer_in' THEN amount ELSE 0 END), 0)
        - COALESCE(SUM(CASE WHEN type = 'transfer_out' THEN amount ELSE 0 END), 0) AS accumulated
      FROM (
        SELECT 'income' AS type, amount FROM income_allocations WHERE "pocketId" = $1
        UNION ALL
        SELECT 'expense' AS type, amount FROM expense_allocations WHERE "pocketId" = $1
        UNION ALL
        SELECT 'transfer_in' AS type, amount FROM pocket_transfers WHERE "targetPocketId" = $1
        UNION ALL
        SELECT 'transfer_out' AS type, amount FROM pocket_transfers WHERE "sourcePocketId" = $1
      ) sub
      `,
      [pocketId],
    );
    return parseFloat(result[0]?.accumulated || "0");
  }

  async saveTransfer(transfer: PocketTransfer): Promise<PocketTransfer> {
    const entity = this.transferToEntity(transfer);
    const savedEntity = await this.pocketTransferRepository.save(entity);
    return this.transferToDomain(savedEntity);
  }
}
