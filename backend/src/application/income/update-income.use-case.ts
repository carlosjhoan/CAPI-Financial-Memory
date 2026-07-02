import { Income } from "../../domain/entities/income.entity";
import { IncomeService } from "../../domain/services/income.service";
import { DataSource } from "typeorm";
import { IncomeAllocationEntity } from "../../infrastructure/persistence/postgres/entities/income-allocation.entity";
import { IncomeEntity } from "../../infrastructure/persistence/postgres/entities/income.entity";
import { AllocationDto } from "../../infrastructure/web/dto/allocation.dto";

export class UpdateIncomeUseCase {
  constructor(
    private readonly incomeService: IncomeService,
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
    },
  ): Promise<Income> {
    // If no allocation changes, use the simple service path
    if (updates.allocations === undefined) {
      return await this.incomeService.updateIncome(userId, id, updates);
    }

    // With allocation changes, do everything in a transaction
    const allocations = updates.allocations;
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        // 1. Load existing income with its old allocations
        const existingEntity = await transactionalEntityManager.findOne(
          IncomeEntity,
          {
            where: { id },
            relations: ["allocations"],
          },
        );

        if (!existingEntity) {
          throw new Error("Income not found");
        }

        if (existingEntity.userId !== userId) {
          throw new Error("Income not found");
        }

        // 2. Delete old allocations
        await transactionalEntityManager.delete(IncomeAllocationEntity, {
          incomeId: id,
        });

        // 4. Update income basic fields
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

        // 5. Create new allocations
        const newAllocations = allocations.map((alloc) =>
          transactionalEntityManager.create(IncomeAllocationEntity, {
            incomeId: id,
            pocketId: alloc.pocketId,
            amount: alloc.amount,
          }),
        );
        await transactionalEntityManager.save(newAllocations);

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
