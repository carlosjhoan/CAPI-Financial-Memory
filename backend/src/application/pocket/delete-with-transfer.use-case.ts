import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { DataSource } from "typeorm";
import { PocketEntity } from "../../infrastructure/persistence/postgres/entities/pocket.entity";
import { PocketTransferEntity } from "../../infrastructure/persistence/postgres/entities/pocket-transfer.entity";
import { DepositEntity } from "../../infrastructure/persistence/postgres/entities/deposit.entity";

export class DeleteWithTransferUseCase {
  constructor(
    private readonly pocketRepository: PocketRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    userId: string,
    pocketId: string,
    distributions: { targetPocketId: string; amount: number }[],
    reason: string,
    date: Date,
  ): Promise<{ deletedPocketId: string; depositsCreated: number }> {
    // --- Pre-transaction validations ---
    const sourcePocket = await this.pocketRepository.findById(pocketId, userId);
    if (!sourcePocket) {
      throw new Error(`POCKET_NOT_FOUND:${pocketId}`);
    }

    const totalDist = distributions.reduce((s, d) => s + d.amount, 0);
    if (Math.abs(totalDist - sourcePocket.accumulatedAmount) > 0.001) {
      throw new Error(
        `DISTRIBUTION_SUM_MISMATCH:${sourcePocket.accumulatedAmount}:${totalDist}`,
      );
    }

    // Reject distributions targeting the source pocket
    for (const d of distributions) {
      if (d.targetPocketId === pocketId) {
        throw new Error(`SOURCE_IS_TARGET:${pocketId}`);
      }
    }

    // Validate all target pockets exist
    for (const d of distributions) {
      const target = await this.pocketRepository.findById(
        d.targetPocketId,
        userId,
      );
      if (!target) {
        throw new Error(`POCKET_NOT_FOUND:${d.targetPocketId}`);
      }
    }

    // --- Atomic transaction ---
    return await this.dataSource.transaction(async (em) => {
      let depositsCreated = 0;

      // 1. Lock source pocket
      const sourceEntity = await em
        .createQueryBuilder(PocketEntity, "p")
        .setLock("pessimistic_write")
        .where("p.id = :id", { id: pocketId })
        .getOne();

      if (!sourceEntity) {
        throw new Error(`POCKET_NOT_FOUND:${pocketId}`);
      }

      // Re-verify balance inside transaction
      const sourceBalance = Number(sourceEntity.accumulatedAmount);
      if (sourceBalance < totalDist) {
        throw new Error(`INSUFFICIENT_FUNDS:${sourceBalance}:${totalDist}`);
      }

      // 2. Debit source first (so balance reflects outgoing)
      sourceEntity.accumulatedAmount = sourceBalance - totalDist;
      sourceEntity.updatedAt = new Date();
      await em.save(sourceEntity);

      // 3. Clean up old transfer records referencing this pocket (FK constraint)
      await em.delete(PocketTransferEntity, {
        sourcePocketId: pocketId,
      });
      await em.delete(PocketTransferEntity, {
        targetPocketId: pocketId,
      });

      // 4. Clean up deposits referencing this pocket
      await em.delete(DepositEntity, { pocketId });

      // 5. Process each distribution: lock target → goal check → credit → create deposit record
      for (const dist of distributions) {
        const targetEntity = await em
          .createQueryBuilder(PocketEntity, "p")
          .setLock("pessimistic_write")
          .where("p.id = :id", { id: dist.targetPocketId })
          .getOne();

        if (!targetEntity) {
          throw new Error(`POCKET_NOT_FOUND:${dist.targetPocketId}`);
        }

        const targetAccumulated = Number(targetEntity.accumulatedAmount);

        // Goal overflow check (same pattern as register-deposit)
        if (targetEntity.type === "goal" && Number(targetEntity.goal) > 0) {
          const remaining = Number(targetEntity.goal) - targetAccumulated;
          if (dist.amount > remaining) {
            throw new Error(
              `TRANSFER_EXCEEDS_GOAL:${remaining}:${dist.amount}:${targetEntity.id}`,
            );
          }
        }

        // Credit target
        targetEntity.accumulatedAmount = targetAccumulated + dist.amount;
        targetEntity.updatedAt = new Date();
        await em.save(targetEntity);

        // Create deposit record on target pocket (so KPIs and history reflect the transfer)
        const depositReason = `Transferencia desde "${sourceEntity.name}" (bolsillo eliminado)`;

        const depositEntity = em.create(DepositEntity, {
          pocketId: dist.targetPocketId,
          amount: dist.amount,
          date,
          reason: depositReason,
        });
        await em.save(depositEntity);
        depositsCreated++;
      }

      // 6. Delete the pocket itself
      await em.delete(PocketEntity, pocketId);

      return { deletedPocketId: pocketId, depositsCreated };
    });
  }
}
