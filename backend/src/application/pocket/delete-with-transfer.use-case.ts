import { Pocket } from "../../domain/entities/pocket.entity";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { DataSource } from "typeorm";
import { PocketEntity } from "../../infrastructure/persistence/postgres/entities/pocket.entity";
import { PocketTransferEntity } from "../../infrastructure/persistence/postgres/entities/pocket-transfer.entity";
import { IncomeAllocationEntity } from "../../infrastructure/persistence/postgres/entities/income-allocation.entity";

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
  ): Promise<{ deletedPocketId: string }> {
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

    // Validate all target pockets exist and cache them
    const targetPocketMap = new Map<string, Pocket>();
    for (const d of distributions) {
      const target = await this.pocketRepository.findById(
        d.targetPocketId,
        userId,
      );
      if (!target) {
        throw new Error(`POCKET_NOT_FOUND:${d.targetPocketId}`);
      }
      targetPocketMap.set(d.targetPocketId, target);
    }

    // --- Atomic transaction ---
    return await this.dataSource.transaction(async (em) => {
      // 1. Lock source pocket
      const sourceEntity = await em
        .createQueryBuilder(PocketEntity, "p")
        .setLock("pessimistic_write")
        .where("p.id = :id", { id: pocketId })
        .getOne();

      if (!sourceEntity) {
        throw new Error(`POCKET_NOT_FOUND:${pocketId}`);
      }

      // 2. Touch updatedAt
      sourceEntity.updatedAt = new Date();
      await em.save(sourceEntity);

      // 3. Nullify transfer records referencing this pocket (preserve financial history)
      await em.update(
        PocketTransferEntity,
        { sourcePocketId: pocketId },
        { sourcePocketId: null, sourcePocketName: sourceEntity.name },
      );
      await em.update(
        PocketTransferEntity,
        { targetPocketId: pocketId },
        { targetPocketId: null, targetPocketName: sourceEntity.name },
      );

      // 4. Nullify income allocations referencing this pocket
      await em.update(IncomeAllocationEntity, { pocketId }, { pocketId: null });

      // 5. Process each distribution: lock target → goal check
      for (const dist of distributions) {
        const targetEntity = await em
          .createQueryBuilder(PocketEntity, "p")
          .setLock("pessimistic_write")
          .where("p.id = :id", { id: dist.targetPocketId })
          .getOne();

        if (!targetEntity) {
          throw new Error(`POCKET_NOT_FOUND:${dist.targetPocketId}`);
        }

        // Goal overflow check — use pre-fetched computed accumulated
        const cachedTarget = targetPocketMap.get(dist.targetPocketId)!;
        if (targetEntity.type === "goal" && Number(targetEntity.goal) > 0) {
          const remaining =
            Number(targetEntity.goal) - cachedTarget.accumulatedAmount;
          if (dist.amount > remaining) {
            throw new Error(
              `TRANSFER_EXCEEDS_GOAL:${remaining}:${dist.amount}:${targetEntity.id}`,
            );
          }
        }

        // Touch updatedAt
        targetEntity.updatedAt = new Date();
        await em.save(targetEntity);

        // Create pocket transfer for this distribution (source pocket is about to be deleted)
        const transferEntity = em.create(PocketTransferEntity, {
          sourcePocketId: null,
          sourcePocketName: sourceEntity.name,
          targetPocketId: dist.targetPocketId,
          amount: dist.amount,
          reason,
          date,
        });
        await em.save(transferEntity);
      }

      // 6. Delete the pocket itself
      await em.delete(PocketEntity, pocketId);

      return { deletedPocketId: pocketId };
    });
  }
}
