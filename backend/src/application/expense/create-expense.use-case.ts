import { Expense } from "../../domain/entities/expense.entity";
import { ExpenseRepository } from "../../domain/repositories/expense.repository";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { DataSource } from "typeorm";
import { ExpenseAllocationEntity } from "../../infrastructure/persistence/postgres/entities/expense-allocation.entity";
import { ExpenseEntity } from "../../infrastructure/persistence/postgres/entities/expense.entity";
import { PocketEntity } from "../../infrastructure/persistence/postgres/entities/pocket.entity";
import { AllocationDto } from "../../infrastructure/web/dto/allocation.dto";

export class CreateExpenseUseCase {
  constructor(
    private readonly expenseRepository: ExpenseRepository,
    private readonly dataSource: DataSource,
    private readonly pocketRepository: PocketRepository,
  ) {}

  async execute(
    userId: string,
    amount: number,
    reason: string,
    date: Date,
    allocations: AllocationDto[],
  ): Promise<Expense> {
    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error("Reason is required");
    }

    // Golden Rule: validate that every pocket has sufficient funds BEFORE the transaction
    for (const alloc of allocations) {
      const pocket = await this.pocketRepository.findById(
        alloc.pocketId,
        userId,
      );
      if (!pocket) {
        throw new Error(`El bolsillo con ID ${alloc.pocketId} no existe`);
      }
      if (pocket.accumulatedAmount < alloc.amount) {
        throw new Error(
          `Fondos insuficientes en el bolsillo "${pocket.name}". ` +
            `Disponible: $${pocket.accumulatedAmount.toFixed(2)}, ` +
            `Solicitado: $${alloc.amount.toFixed(2)}`,
        );
      }
    }

    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        // 1. Save expense
        const expenseEntity = transactionalEntityManager.create(ExpenseEntity, {
          amount,
          reason,
          date,
          userId,
        });
        const savedExpense =
          await transactionalEntityManager.save(expenseEntity);

        // 2. Save allocations
        const allocationEntities = allocations.map((alloc) =>
          transactionalEntityManager.create(ExpenseAllocationEntity, {
            expenseId: savedExpense.id,
            pocketId: alloc.pocketId,
            amount: alloc.amount,
          }),
        );
        await transactionalEntityManager.save(allocationEntities);

        // 3. Decrement each pocket's accumulated amount
        for (const alloc of allocations) {
          const pocket = await transactionalEntityManager.findOne(PocketEntity, {
            where: { id: alloc.pocketId },
          });
          if (pocket) {
            pocket.accumulatedAmount = Number(pocket.accumulatedAmount) - alloc.amount;
            await transactionalEntityManager.save(pocket);
          }
        }

        return new Expense(
          savedExpense.amount,
          savedExpense.reason,
          savedExpense.date,
          savedExpense.id,
        );
      },
    );
  }
}
