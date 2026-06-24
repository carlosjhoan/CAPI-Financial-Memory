import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { DataSource } from "typeorm";
import { PocketEntity } from "../../infrastructure/persistence/postgres/entities/pocket.entity";
import { PocketTransferEntity } from "../../infrastructure/persistence/postgres/entities/pocket-transfer.entity";
import { IncomeEntity } from "../../infrastructure/persistence/postgres/entities/income.entity";
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
  ): Promise<{ deletedPocketId: string; transfersCreated: number }> {
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
      let transfersCreated = 0;

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

      // 4. Clean up income allocations referencing this pocket
      await em.delete(IncomeAllocationEntity, { pocketId });

      // 5. Process each distribution: lock target → goal check → credit → create income record
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

        // Create income + allocation on target pocket (so KPIs and history reflect the transfer)
        const depositReason = `Transferencia desde "${sourceEntity.name}" (bolsillo eliminado)`;

        const incomeEntity = em.create(IncomeEntity, {
          userId: sourceEntity.userId,
          amount: dist.amount,
          reason: depositReason,
          date,
        });
        const savedIncome = await em.save(incomeEntity);

        const allocationEntity = em.create(IncomeAllocationEntity, {
          incomeId: savedIncome.id,
          pocketId: dist.targetPocketId,
          amount: dist.amount,
        });
        await em.save(allocationEntity);
        transfersCreated++;
      }

      // 6. Delete the pocket itself
      await em.delete(PocketEntity, pocketId);

      return { deletedPocketId: pocketId, transfersCreated };
    });
  }
}
