import { Pocket } from "../../domain/entities/pocket.entity";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { DataSource } from "typeorm";
import { PocketEntity } from "../../infrastructure/persistence/postgres/entities/pocket.entity";
import { IncomeEntity } from "../../infrastructure/persistence/postgres/entities/income.entity";
import { IncomeAllocationEntity } from "../../infrastructure/persistence/postgres/entities/income-allocation.entity";
import { PocketTransferEntity } from "../../infrastructure/persistence/postgres/entities/pocket-transfer.entity";

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

          return pocket;
        },
      );
    }

    // Transfer from another pocket (source debited atomically)
    if (sourceType === "transfer" && accumulatedAmount > 0) {
      if (!_sourcePocketId) {
        throw new Error(
          "El ID del bolsillo de origen es obligatorio cuando el origen es una transferencia",
        );
      }

      // Pre-transaction validation
      const sourcePocket = await this.pocketRepository.findById(
        _sourcePocketId,
        userId,
      );
      if (!sourcePocket) {
        throw new Error(
          `No se encontró el bolsillo de origen con ID ${_sourcePocketId}`,
        );
      }

      if (sourcePocket.accumulatedAmount < accumulatedAmount) {
        throw new Error(
          `Fondos insuficientes en el bolsillo "${sourcePocket.name}". ` +
            `Disponible: $${sourcePocket.accumulatedAmount.toFixed(2)}, ` +
            `Solicitado: $${accumulatedAmount.toFixed(2)}`,
        );
      }

      // Atomic transaction with pessimistic lock (mirrors TransferBetweenPocketsUseCase)
      return await this.dataSource.transaction(
        async (transactionalEntityManager) => {
          // 1. Reload source pocket with pessimistic lock
          const sourceEntity = await transactionalEntityManager
            .createQueryBuilder(PocketEntity, "pocket")
            .setLock("pessimistic_write")
            .where("pocket.id = :id", { id: _sourcePocketId })
            .getOne();

          if (!sourceEntity) {
            throw new Error(
              `No se encontró el bolsillo de origen con ID ${_sourcePocketId}`,
            );
          }

          // 2. Create new pocket
          const pocketEntity = transactionalEntityManager.create(PocketEntity, {
            name: pocket.name,
            type: pocket.type,
            goal: pocket.goal,
            motivation: pocket.motivation,
            userId: pocket.userId,
          });
          const savedEntity =
            await transactionalEntityManager.save(pocketEntity);

          // Map back to domain entity
          pocket.id = savedEntity.id;
          pocket.createdAt = savedEntity.createdAt;
          pocket.updatedAt = savedEntity.updatedAt;

          // 3. Create transfer record
          const date = new Date();
          const transferReason = `Monto inicial de bolsillo ${name}`;
          const transferEntity = transactionalEntityManager.create(
            PocketTransferEntity,
            {
              sourcePocketId: _sourcePocketId,
              targetPocketId: savedEntity.id,
              amount: accumulatedAmount,
              reason: transferReason,
              date,
            },
          );
          await transactionalEntityManager.save(transferEntity);

          return pocket;
        },
      );
    }

    // Default: simple save (no transaction, no income)
    return await this.pocketRepository.save(pocket);
  }
}
