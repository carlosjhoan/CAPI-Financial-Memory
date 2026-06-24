import { DataSource } from "typeorm";
import { IncomeEntity } from "../../infrastructure/persistence/postgres/entities/income.entity";
import { IncomeAllocationEntity } from "../../infrastructure/persistence/postgres/entities/income-allocation.entity";
import { PocketEntity } from "../../infrastructure/persistence/postgres/entities/pocket.entity";
import { IncomeRepository } from "../../domain/repositories/income.repository";

export class DeleteIncomeUseCase {
  constructor(
    private readonly incomeRepository: IncomeRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(userId: string, id: string): Promise<void> {
    // Load income to verify ownership
    const income = await this.incomeRepository.findById(id, userId);
    if (!income) {
      throw new Error("Income not found");
    }

    await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        // 1. Load allocations
        const allocations = await transactionalEntityManager.find(
          IncomeAllocationEntity,
          { where: { incomeId: id } },
        );

        // 2. Revert pocket balances
        for (const alloc of allocations) {
          const pocket = await transactionalEntityManager.findOne(PocketEntity, {
            where: { id: alloc.pocketId },
          });
          if (pocket) {
            pocket.accumulatedAmount =
              Number(pocket.accumulatedAmount) - Number(alloc.amount);
            await transactionalEntityManager.save(pocket);
          }
        }

        // 3. Delete allocations
        await transactionalEntityManager.delete(IncomeAllocationEntity, {
          incomeId: id,
        });

        // 4. Delete income
        await transactionalEntityManager.delete(IncomeEntity, { id });
      },
    );
  }
}
