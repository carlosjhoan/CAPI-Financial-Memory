import { Expense } from "../../domain/entities/expense.entity";
import { ExpenseService } from "../../domain/services/expense.service";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { DataSource } from "typeorm";
import { ExpenseAllocationEntity } from "../../infrastructure/persistence/postgres/entities/expense-allocation.entity";
import { ExpenseEntity } from "../../infrastructure/persistence/postgres/entities/expense.entity";
import { PocketEntity } from "../../infrastructure/persistence/postgres/entities/pocket.entity";
import { AllocationDto } from "../../infrastructure/web/dto/allocation.dto";

export class UpdateExpenseUseCase {
  constructor(
    private readonly expenseService: ExpenseService,
    private readonly dataSource: DataSource,
    private readonly pocketRepository: PocketRepository,
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
  ): Promise<Expense> {
    // If no allocation changes, use the simple service path
    if (updates.allocations === undefined) {
      return await this.expenseService.updateExpense(userId, id, updates);
    }

    // Load old allocations for Golden Rule check
    const existingEntity = await this.dataSource.manager.findOne(ExpenseEntity, {
      where: { id },
      relations: ["allocations"],
    });

    if (!existingEntity) {
      throw new Error("Expense not found");
    }

    if (existingEntity.userId !== userId) {
      throw new Error("Expense not found");
    }

    const oldAllocations = await this.dataSource.manager.find(
      ExpenseAllocationEntity,
      {
        where: { expenseId: id },
      },
    );

    const allocations = updates.allocations;

    // Build a map of old allocation amounts per pocket { pocketId: amount }
    const oldAllocMap = new Map<string, number>();
    for (const old of oldAllocations) {
      oldAllocMap.set(old.pocketId, Number(old.amount));
    }

    // Golden Rule: validate sufficient funds considering reverted old allocations
    for (const alloc of allocations) {
      const oldAmount = oldAllocMap.get(alloc.pocketId) ?? 0;
      const pocket = await this.pocketRepository.findById(
        alloc.pocketId,
        userId,
      );

      if (!pocket) {
        throw new Error(`El bolsillo con ID ${alloc.pocketId} no existe`);
      }

      // After reverting old allocation, the pocket has (currentBalance + oldAmount)
      // We need that to be >= newAmount
      const availableAfterRevert =
        Number(pocket.accumulatedAmount) + oldAmount;

      if (availableAfterRevert < alloc.amount) {
        throw new Error(
          `Fondos insuficientes en el bolsillo "${pocket.name}". ` +
            `Disponible: $${availableAfterRevert.toFixed(2)}, ` +
            `Solicitado: $${alloc.amount.toFixed(2)}`,
        );
      }
    }

    // With allocation changes, do everything in a transaction
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        // 1. Revert old allocations (add back to pocket balances)
        for (const oldAlloc of oldAllocations) {
          const pocket = await transactionalEntityManager.findOne(
            PocketEntity,
            { where: { id: oldAlloc.pocketId } },
          );
          if (pocket) {
            pocket.accumulatedAmount =
              Number(pocket.accumulatedAmount) + Number(oldAlloc.amount);
            await transactionalEntityManager.save(pocket);
          }
        }

        // 2. Delete old allocations
        await transactionalEntityManager.delete(ExpenseAllocationEntity, {
          expenseId: id,
        });

        // 3. Update expense basic fields
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

        // 4. Create new allocations
        const newAllocations = allocations.map((alloc) =>
          transactionalEntityManager.create(ExpenseAllocationEntity, {
            expenseId: id,
            pocketId: alloc.pocketId,
            amount: alloc.amount,
          }),
        );
        await transactionalEntityManager.save(newAllocations);

        // 5. Decrement pocket balances for new allocations
        for (const alloc of allocations) {
          const pocket = await transactionalEntityManager.findOne(
            PocketEntity,
            { where: { id: alloc.pocketId } },
          );
          if (pocket) {
            pocket.accumulatedAmount =
              Number(pocket.accumulatedAmount) - alloc.amount;
            await transactionalEntityManager.save(pocket);
          }
        }

        return new Expense(
          existingEntity.amount,
          existingEntity.reason,
          existingEntity.date,
          existingEntity.id,
        );
      },
    );
  }
}
