import { PocketTransfer } from "../../domain/entities/pocket-transfer.entity";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { DataSource } from "typeorm";
import { PocketEntity } from "../../infrastructure/persistence/postgres/entities/pocket.entity";
import { PocketTransferEntity } from "../../infrastructure/persistence/postgres/entities/pocket-transfer.entity";

export class TransferBetweenPocketsUseCase {
  constructor(
    private readonly pocketRepository: PocketRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    userId: string,
    sourcePocketId: string,
    targetPocketId: string,
    amount: number,
    reason: string,
    date: Date,
    newGoal?: number,
  ): Promise<PocketTransfer> {
    // --- Validaciones previas a la transacción ---

    if (amount <= 0) {
      throw new Error("Transfer amount must be greater than 0");
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error("Reason is required");
    }

    if (sourcePocketId === targetPocketId) {
      throw new Error("Source and target pockets must be different");
    }

    const sourcePocket = await this.pocketRepository.findById(
      sourcePocketId,
      userId,
    );
    if (!sourcePocket) {
      throw new Error(`Source pocket with ID ${sourcePocketId} not found`);
    }

    const targetPocket = await this.pocketRepository.findById(
      targetPocketId,
      userId,
    );
    if (!targetPocket) {
      throw new Error(`Target pocket with ID ${targetPocketId} not found`);
    }

    if (sourcePocket.accumulatedAmount < amount) {
      throw new Error(
        `Insufficient funds in source pocket "${sourcePocket.name}". ` +
          `Available: $${sourcePocket.accumulatedAmount.toFixed(2)}, ` +
          `Requested: $${amount.toFixed(2)}`,
      );
    }

    // --- Ejecución atómica dentro de una transacción ---

    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        // 1. Reload pockets within transaction (with pessimistic lock)
        const sourceEntity = await transactionalEntityManager
          .createQueryBuilder(PocketEntity, "pocket")
          .setLock("pessimistic_write")
          .where("pocket.id = :id", { id: sourcePocketId })
          .getOne();

        if (!sourceEntity) {
          throw new Error(`Source pocket with ID ${sourcePocketId} not found`);
        }

        const targetEntity = await transactionalEntityManager
          .createQueryBuilder(PocketEntity, "pocket")
          .setLock("pessimistic_write")
          .where("pocket.id = :id", { id: targetPocketId })
          .getOne();

        if (!targetEntity) {
          throw new Error(`Target pocket with ID ${targetPocketId} not found`);
        }

        // 2. Goal overflow check — use pre-fetched computed accumulated
        const targetGoal = Number(targetEntity.goal);

        if (targetEntity.type === "goal" && targetGoal > 0) {
          const remaining = targetGoal - targetPocket.accumulatedAmount;
          if (amount > remaining) {
            // If newGoal provided and valid, extend goal
            if (newGoal && newGoal > targetGoal) {
              targetEntity.goal = newGoal;
            } else {
              throw new Error(
                `TRANSFER_EXCEEDS_GOAL:${remaining}:${amount}:${targetPocketId}`,
              );
            }
          }
        }

        // 3. Touch updatedAt on both pockets
        sourceEntity.updatedAt = new Date();
        await transactionalEntityManager.save(sourceEntity);
        targetEntity.updatedAt = new Date();
        await transactionalEntityManager.save(targetEntity);

        // 4. Create transfer record
        const transferEntity = transactionalEntityManager.create(
          PocketTransferEntity,
          {
            sourcePocketId,
            targetPocketId,
            sourcePocketName: sourceEntity.name,
            targetPocketName: targetEntity.name,
            amount,
            reason,
            date,
          },
        );
        const savedTransfer =
          await transactionalEntityManager.save(transferEntity);

        // 5. Return domain entity
        const transfer = new PocketTransfer(
          savedTransfer.sourcePocketId,
          savedTransfer.targetPocketId,
          Number(savedTransfer.amount),
          savedTransfer.reason,
          savedTransfer.date,
          savedTransfer.id,
        );
        transfer.createdAt = savedTransfer.createdAt;

        return transfer;
      },
    );
  }
}
