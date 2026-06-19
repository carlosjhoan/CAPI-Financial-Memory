import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Pocket } from "../../../../domain/entities/pocket.entity";
import { Deposit } from "../../../../domain/entities/deposit.entity";
import { Expense } from "../../../../domain/entities/expense.entity";
import { PocketTransfer } from "../../../../domain/entities/pocket-transfer.entity";
import { PocketRepository } from "../../../../domain/repositories/pocket.repository";
import { PocketEntity } from "../entities/pocket.entity";
import { DepositEntity } from "../entities/deposit.entity";
import { ExpenseAllocationEntity } from "../entities/expense-allocation.entity";
import { ExpenseEntity } from "../entities/expense.entity";
import { PocketTransferEntity } from "../entities/pocket-transfer.entity";

@Injectable()
export class TypeOrmPocketRepository implements PocketRepository {
  constructor(
    @InjectRepository(PocketEntity)
    private readonly pocketRepository: Repository<PocketEntity>,
    @InjectRepository(DepositEntity)
    private readonly depositRepository: Repository<DepositEntity>,
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
      Number(entity.accumulatedAmount),
      entity.motivation,
      entity.id,
    );
    pocket.initialAmount = Number(entity.initialAmount);
    pocket.createdAt = entity.createdAt;
    pocket.updatedAt = entity.updatedAt;
    return pocket;
  }

  private toEntity(domain: Pocket): PocketEntity {
    const entity = new PocketEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.name = domain.name;
    entity.type = domain.type;
    entity.goal = domain.goal;
    entity.accumulatedAmount = domain.accumulatedAmount;
    entity.initialAmount = domain.initialAmount;
    entity.motivation = domain.motivation;
    entity.createdAt = domain.createdAt;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }

  private depositToDomain(entity: DepositEntity): Deposit {
    const deposit = new Deposit(
      entity.pocketId,
      Number(entity.amount),
      entity.date,
      entity.reason,
      entity.id,
    );
    deposit.createdAt = entity.createdAt;
    return deposit;
  }

  private depositToEntity(domain: Deposit): DepositEntity {
    const entity = new DepositEntity();
    if (domain.id) {
      entity.id = domain.id;
    }
    entity.pocketId = domain.pocketId;
    entity.amount = domain.amount;
    entity.date = domain.date;
    entity.reason = domain.reason;
    entity.createdAt = domain.createdAt;
    return entity;
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
    return entity ? this.toDomain(entity) : null;
  }

  async findAll(userId: string): Promise<Pocket[]> {
    const entities = await this.pocketRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
    const pockets = entities.map((entity) => this.toDomain(entity));

    // Obtener depositCount y last 4 deposits para cada pocket
    const pocketIds = pockets.map((p) => p.id);
    if (pocketIds.length > 0) {
      // Obtener conteos
      const counts = await this.depositRepository
        .createQueryBuilder("deposit")
        .select("deposit.pocketId", "pocketId")
        .addSelect("COUNT(deposit.id)", "count")
        .where("deposit.pocketId IN (:...pocketIds)", { pocketIds })
        .groupBy("deposit.pocketId")
        .getRawMany();

      const countMap = new Map<string, number>(
        counts.map((c: any) => [c.pocketId, parseInt(c.count, 10)]),
      );

      // Obtener últimos depósitos (last 4) por pocket
      const lastDeposits = await this.depositRepository
        .createQueryBuilder("deposit")
        .where("deposit.pocketId IN (:...pocketIds)", { pocketIds })
        .orderBy("deposit.date", "DESC")
        .limit(pocketIds.length * 7) // 7 por cada pocket
        .getMany();

      // Agrupar por pocketId
      const depositsByPocket = new Map<string, Deposit[]>();
      lastDeposits.forEach((d) => {
        const pid = d.pocketId;
        if (!depositsByPocket.has(pid)) {
          depositsByPocket.set(pid, []);
        }
        // Tomar solo los últimos 7 por pocket (ya viene ordenado DESC)
        const arr = depositsByPocket.get(pid)!;
        if (arr.length < 7) {
          arr.push(this.depositToDomain(d));
        }
      });

      // Asignar a cada pocket
      pockets.forEach((p) => {
        p.depositCount = countMap.get(p.id) ?? 0;
        p.deposits = depositsByPocket.get(p.id) ?? [];
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

        // Para el pocket origen → outgoing
        const sourcePid = t.sourcePocketId;
        if (!transfersByPocket.has(sourcePid)) {
          transfersByPocket.set(sourcePid, []);
        }
        transfersByPocket.get(sourcePid)!.push({
          ...domain,
          direction: "outgoing",
        });

        // Para el pocket destino → incoming
        const targetPid = t.targetPocketId;
        if (!transfersByPocket.has(targetPid)) {
          transfersByPocket.set(targetPid, []);
        }
        transfersByPocket.get(targetPid)!.push({
          ...domain,
          direction: "incoming",
        });
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
    // Delete transfer records referencing this pocket (both as source and target)
    await this.pocketTransferRepository.delete({ sourcePocketId: id });
    await this.pocketTransferRepository.delete({ targetPocketId: id });
    // Cascade delete deposits associated with this pocket
    await this.depositRepository.delete({ pocketId: id });
    const where: any = { id };
    if (userId) where.userId = userId;
    await this.pocketRepository.delete(where);
  }

  async getSummary(
    userId: string,
  ): Promise<{ totalAccumulated: number; totalGoal: number; count: number }> {
    const result = await this.pocketRepository
      .createQueryBuilder("pocket")
      .select("SUM(pocket.accumulatedAmount)", "totalAccumulated")
      .addSelect("SUM(pocket.goal)", "totalGoal")
      .addSelect("COUNT(pocket.id)", "count")
      .where("pocket.userId = :userId", { userId })
      .getRawOne();

    return {
      totalAccumulated: parseFloat(result?.totalAccumulated || 0),
      totalGoal: parseFloat(result?.totalGoal || 0),
      count: parseInt(result?.count || 0),
    };
  }

  async findDepositsByPocketId(
    pocketId: string,
    options?: { offset?: number; limit?: number },
  ): Promise<Deposit[]> {
    const query = this.depositRepository
      .createQueryBuilder("deposit")
      .where("deposit.pocketId = :pocketId", { pocketId })
      .orderBy("deposit.date", "DESC");

    if (options?.offset) {
      query.skip(options.offset);
    }
    if (options?.limit) {
      query.take(options.limit);
    }

    const entities = await query.getMany();
    return entities.map((entity) => this.depositToDomain(entity));
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

  async saveDeposit(deposit: Deposit): Promise<Deposit> {
    const entity = this.depositToEntity(deposit);
    const savedEntity = await this.depositRepository.save(entity);
    return this.depositToDomain(savedEntity);
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
             reason, direction, "sourcePocketId", "targetPocketId"
      FROM (
        SELECT
          d.id,
          'deposit' AS type,
          d.amount,
          d.date,
          d."createdAt",
          d.reason,
          NULL::text AS direction,
          NULL::uuid AS "sourcePocketId",
          NULL::uuid AS "targetPocketId",
          d.date AS sort_date,
          d."createdAt" AS sort_created
        FROM deposits d
        WHERE d."pocketId"::text = $1

        UNION ALL

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
        SELECT id FROM deposits WHERE "pocketId"::text = $1
        UNION ALL
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

  async saveTransfer(transfer: PocketTransfer): Promise<PocketTransfer> {
    const entity = this.transferToEntity(transfer);
    const savedEntity = await this.pocketTransferRepository.save(entity);
    return this.transferToDomain(savedEntity);
  }
}
