import { PocketTransfer } from "../../domain/entities/pocket-transfer.entity";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { DataSource } from "typeorm";
import { PocketEntity } from "../../infrastructure/persistence/postgres/entities/pocket.entity";
import { PocketTransferEntity } from "../../infrastructure/persistence/postgres/entities/pocket-transfer.entity";

export class UpdateTransferUseCase {
  constructor(
    private readonly pocketRepository: PocketRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    userId: string,
    transferId: string,
    updates: {
      amount: number;
      reason: string;
      newGoal?: number;
    },
  ): Promise<PocketTransfer> {
    const { amount, reason, newGoal } = updates;

    // ── Pre-validations ──

    if (amount <= 0) {
      throw new Error("Transfer amount must be greater than 0");
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error("Reason is required");
    }

    // 1. Find existing transfer
    const existingTransfer = await this.pocketRepository.findTransferById(
      transferId,
    );
    if (!existingTransfer) {
      throw new Error(`Transfer with ID ${transferId} not found`);
    }

    if (!existingTransfer.sourcePocketId || !existingTransfer.targetPocketId) {
      throw new Error("Cannot edit a transfer referencing a deleted pocket");
    }

    const oldAmount = existingTransfer.amount;
    const sourcePocketId = existingTransfer.sourcePocketId;
    const targetPocketId = existingTransfer.targetPocketId;

    // 2. Ownership check — load both pockets
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

    // 3. Source funds check
    // currentAccumulated already has the old deduction (-oldAmount).
    // After update, the deduction becomes -newAmount.
    // So source needs: currentAccumulated + oldAmount >= newAmount
    const availableInSource = sourcePocket.accumulatedAmount + oldAmount;
    if (availableInSource < amount) {
      throw new Error(
        `Insufficient funds in source pocket "${sourcePocket.name}". ` +
          `Available: $${availableInSource.toFixed(2)}, ` +
          `Requested: $${amount.toFixed(2)}`,
      );
    }

    // 4. Target goal overflow check
    let goalToExtend: number | undefined;
    if (targetPocket.type === "goal" && targetPocket.goal > 0) {
      // currentAccumulated already has the old addition (+oldAmount).
      // After update, the addition becomes +newAmount.
      // So new accumulated would be: currentAccumulated - oldAmount + newAmount
      const wouldBeAccumulated =
        targetPocket.accumulatedAmount - oldAmount + amount;

      if (wouldBeAccumulated > targetPocket.goal) {
        if (newGoal && newGoal > targetPocket.goal) {
          goalToExtend = newGoal;
        } else {
          throw new Error(
            `TRANSFER_EXCEEDS_GOAL:${targetPocket.goal - (targetPocket.accumulatedAmount - oldAmount)}:${amount}:${targetPocketId}`,
          );
        }
      }
    }

    // ── Atomic transaction ──
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        // 1. Lock source pocket
        const sourceEntity = await transactionalEntityManager
          .createQueryBuilder(PocketEntity, "pocket")
          .setLock("pessimistic_write")
          .where("pocket.id = :id", { id: sourcePocketId })
          .getOne();

        if (!sourceEntity) {
          throw new Error(
            `Source pocket with ID ${sourcePocketId} not found`,
          );
        }

        // 2. Lock target pocket
        const targetEntity = await transactionalEntityManager
          .createQueryBuilder(PocketEntity, "pocket")
          .setLock("pessimistic_write")
          .where("pocket.id = :id", { id: targetPocketId })
          .getOne();

        if (!targetEntity) {
          throw new Error(
            `Target pocket with ID ${targetPocketId} not found`,
          );
        }

        // 3. Touch updatedAt on both pockets
        sourceEntity.updatedAt = new Date();
        await transactionalEntityManager.save(sourceEntity);
        targetEntity.updatedAt = new Date();
        await transactionalEntityManager.save(targetEntity);

        // 4. Update transfer record
        const transferEntity = await transactionalEntityManager.findOne(
          PocketTransferEntity,
          {
            where: { id: transferId },
          },
        );

        if (!transferEntity) {
          throw new Error(`Transfer with ID ${transferId} not found`);
        }

        transferEntity.amount = amount;
        transferEntity.reason = reason;
        await transactionalEntityManager.save(transferEntity);

        // 5. Extend goal if user opted to
        if (goalToExtend !== undefined) {
          targetEntity.goal = goalToExtend;
          await transactionalEntityManager.save(targetEntity);
        }

        // 6. Return updated domain entity
        return new PocketTransfer(
          sourcePocketId,
          targetPocketId,
          amount,
          reason,
          existingTransfer.date,
          transferId,
        );
      },
    );
  }
}
