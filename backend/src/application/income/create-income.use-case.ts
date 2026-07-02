import { Income } from "../../domain/entities/income.entity";
import { IncomeRepository } from "../../domain/repositories/income.repository";
import { DataSource } from "typeorm";
import { IncomeAllocationEntity } from "../../infrastructure/persistence/postgres/entities/income-allocation.entity";
import { IncomeEntity } from "../../infrastructure/persistence/postgres/entities/income.entity";
import { AllocationDto } from "../../infrastructure/web/dto/allocation.dto";

export class CreateIncomeUseCase {
  constructor(
    private readonly incomeRepository: IncomeRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    userId: string,
    amount: number,
    reason: string,
    date: Date,
    allocations: AllocationDto[],
  ): Promise<Income> {
    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error("Reason is required");
    }

    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        // 1. Save income using TypeORM entity directly to have transactional control
        const incomeEntity = transactionalEntityManager.create(IncomeEntity, {
          amount,
          reason,
          date,
          userId,
        });
        const savedIncome = await transactionalEntityManager.save(incomeEntity);

        // 2. Save allocations
        const allocationEntities = allocations.map((alloc) =>
          transactionalEntityManager.create(IncomeAllocationEntity, {
            incomeId: savedIncome.id,
            pocketId: alloc.pocketId,
            amount: alloc.amount,
          }),
        );
        await transactionalEntityManager.save(allocationEntities);

        return new Income(
          savedIncome.amount,
          savedIncome.reason,
          savedIncome.date,
          savedIncome.id,
        );
      },
    );
  }
}
