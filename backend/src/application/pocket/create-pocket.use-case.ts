import { Pocket } from "../../domain/entities/pocket.entity";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { DataSource } from "typeorm";
import { PocketEntity } from "../../infrastructure/persistence/postgres/entities/pocket.entity";
import { IncomeEntity } from "../../infrastructure/persistence/postgres/entities/income.entity";
import { IncomeAllocationEntity } from "../../infrastructure/persistence/postgres/entities/income-allocation.entity";

export class CreatePocketUseCase {
  constructor(
    private readonly pocketRepository: PocketRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    userId: string,
    name: string,
    type: "goal" | "deposit",
    goal: number,
    accumulatedAmount: number,
    motivation: string,
    sourceType?: "external" | "transfer",
    _sourcePocketId?: string,
  ): Promise<Pocket> {
    if (!name || name.trim().length === 0) {
      throw new Error("Name is required");
    }

    if (type !== "goal" && type !== "deposit") {
      throw new Error("Type must be 'goal' or 'deposit'");
    }

    if (type === "goal" && goal <= 0) {
      throw new Error("Goal must be greater than 0 for goal-type pockets");
    }

    if (accumulatedAmount < 0) {
      throw new Error("Accumulated amount cannot be negative");
    }

    const finalMotivation =
      motivation && motivation.trim().length > 0
        ? motivation.trim()
        : "Quiero ahorrar para algo que aún no sé qué es";

    const pocket = new Pocket(
      name,
      type,
      goal,
      accumulatedAmount,
      finalMotivation,
      undefined,
      userId,
    );

    // Auto-create income when source is external and there's money entering
    if (sourceType === "external" && accumulatedAmount > 0) {
      return await this.dataSource.transaction(
        async (transactionalEntityManager) => {
          // 1. Save the pocket entity (accumulatedAmount starts at 0,
          //    the income allocation will increment it)
          const pocketEntity = transactionalEntityManager.create(PocketEntity, {
            name: pocket.name,
            type: pocket.type,
            goal: pocket.goal,
            accumulatedAmount: 0,
            motivation: pocket.motivation,
            userId: pocket.userId,
          });
          const savedEntity =
            await transactionalEntityManager.save(pocketEntity);

          // Map back to domain entity
          pocket.id = savedEntity.id;
          pocket.createdAt = savedEntity.createdAt;
          pocket.updatedAt = savedEntity.updatedAt;

          // 2. Create income + allocation in the SAME transaction
          const date = new Date();
          const incomeReason = `Monto inicial de bolsillo ${name}`;

          const incomeEntity = transactionalEntityManager.create(IncomeEntity, {
            amount: accumulatedAmount,
            reason: incomeReason,
            date,
            userId,
          });
          const savedIncome =
            await transactionalEntityManager.save(incomeEntity);

          const allocationEntity = transactionalEntityManager.create(
            IncomeAllocationEntity,
            {
              incomeId: savedIncome.id,
              pocketId: pocket.id,
              amount: accumulatedAmount,
            },
          );
          await transactionalEntityManager.save(allocationEntity);

          // 3. Update pocket accumulated amount
          savedEntity.accumulatedAmount =
            Number(savedEntity.accumulatedAmount) + accumulatedAmount;
          await transactionalEntityManager.save(savedEntity);
          pocket.accumulatedAmount = accumulatedAmount;

          return pocket;
        },
      );
    }

    // Default: simple save (no transaction, no income)
    return await this.pocketRepository.save(pocket);
  }
}
