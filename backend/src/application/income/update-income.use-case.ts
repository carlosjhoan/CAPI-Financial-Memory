import { Income } from "../../domain/entities/income.entity";
import { IncomeService } from "../../domain/services/income.service";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { DataSource } from "typeorm";
import { IncomeAllocationEntity } from "../../infrastructure/persistence/postgres/entities/income-allocation.entity";
import { IncomeEntity } from "../../infrastructure/persistence/postgres/entities/income.entity";
import { PocketEntity } from "../../infrastructure/persistence/postgres/entities/pocket.entity";
import { AllocationDto } from "../../infrastructure/web/dto/allocation.dto";

export class UpdateIncomeUseCase {
  constructor(
    private readonly incomeService: IncomeService,
    private readonly pocketRepository: PocketRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    userId: string,
    id: string,
    updates: {
      amount?: number;
      reason?: string;
      date?: Date;
      allocations?: AllocationDto[];
      goals?: Record<string, number>;
    },
  ): Promise<Income> {
    // If no allocation changes, use the simple service path
    if (updates.allocations === undefined) {
      return await this.incomeService.updateIncome(userId, id, updates);
    }

    const allocations = updates.allocations;

    // ── Pre-validate: check goal pockets BEFORE transaction ──
    // Load existing income with its old allocations
    const existingEntity = await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        return await transactionalEntityManager.findOne(IncomeEntity, {
          where: { id },
          relations: ["allocations"],
        });
      },
    );

    if (!existingEntity) {
      throw new Error("Income not found");
    }

    if (existingEntity.userId !== userId) {
      throw new Error("Income not found");
    }

    // Build map of old allocation amounts by pocketId
    const oldAllocationsByPocket = new Map<string, number>();
    for (const alloc of existingEntity.allocations || []) {
      if (alloc.pocketId) {
        oldAllocationsByPocket.set(alloc.pocketId, Number(alloc.amount));
      }
    }

    // Validate goals: for each Goal pocket being increased, check accumulated
    const goalsToExtend = new Map<string, number>(); // pocketId → newGoal
    const uniquePocketIds = [...new Set(allocations.map((a) => a.pocketId))];

    for (const pocketId of uniquePocketIds) {
      const pocket = await this.pocketRepository.findById(pocketId, userId);
      if (!pocket || pocket.type !== "goal" || pocket.goal <= 0) continue;

      const newAmount =
        allocations.find((a) => a.pocketId === pocketId)?.amount || 0;
      const oldAmount = oldAllocationsByPocket.get(pocketId) || 0;
      const delta = newAmount - oldAmount;

      if (delta > 0) {
        const wouldBeAccumulated = pocket.accumulatedAmount + delta;
        if (wouldBeAccumulated > pocket.goal) {
          const newGoal = updates.goals?.[pocketId];
          if (newGoal && newGoal > pocket.goal) {
            goalsToExtend.set(pocketId, newGoal);
          } else {
            const remaining = pocket.goal - pocket.accumulatedAmount;
            throw new Error(
              `INCOME_EDIT_EXCEEDS_GOAL:${pocketId}:${pocket.name}:${pocket.goal}:${wouldBeAccumulated}`,
            );
          }
        }
      }
    }

    // ── Execute atomically ──
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        // 1. Delete old allocations
        await transactionalEntityManager.delete(IncomeAllocationEntity, {
          incomeId: id,
        });

        // 2. Update income basic fields
        if (updates.amount !== undefined) {
          if (updates.amount <= 0) {
            throw new Error("Amount must be greater than 0");
          }
          existingEntity.amount = updates.amount;
        }

        if (updates.reason !== undefined) {
          if (!updates.reason || updates.reason.trim().length === 0) {
            throw new Error("Reason cannot be empty");
          }
          if (updates.reason.length > 255) {
            throw new Error("Reason cannot be longer than 255 characters");
          }
          existingEntity.reason = updates.reason;
        }

        if (updates.date !== undefined) {
          existingEntity.date = updates.date;
        }

        await transactionalEntityManager.save(existingEntity);

        // 3. Create new allocations
        const newAllocations = allocations.map((alloc) =>
          transactionalEntityManager.create(IncomeAllocationEntity, {
            incomeId: id,
            pocketId: alloc.pocketId,
            amount: alloc.amount,
          }),
        );
        await transactionalEntityManager.save(newAllocations);

        // 4. Extend goals if user opted to
        for (const [pocketId, newGoal] of goalsToExtend) {
          const pocketEntity = await transactionalEntityManager
            .createQueryBuilder(PocketEntity, "pocket")
            .setLock("pessimistic_write")
            .where("pocket.id = :id", { id: pocketId })
            .getOne();

          if (pocketEntity) {
            pocketEntity.goal = Number(newGoal);
            pocketEntity.updatedAt = new Date();
            await transactionalEntityManager.save(pocketEntity);
          }
        }

        return new Income(
          existingEntity.amount,
          existingEntity.reason,
          existingEntity.date,
          existingEntity.id,
        );
      },
    );
  }
}
