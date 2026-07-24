import { Income } from "../../domain/entities/income.entity";
import { IncomeRepository } from "../../domain/repositories/income.repository";
import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { DataSource } from "typeorm";
import { IncomeEntity } from "../../infrastructure/persistence/postgres/entities/income.entity";
import { IncomeAllocationEntity } from "../../infrastructure/persistence/postgres/entities/income-allocation.entity";
import { computeProRata, AllocationInfo } from "../../shared/utils/pro-rata";

interface AdjustmentResult {
  type: "income";
  amount: number;
  adjustedRecordId: string;
  isAdjustment: boolean;
  reason: string;
  date: Date;
  allocations: AllocationInfo[];
}

export class CreateIncomeAdjustmentUseCase {
  constructor(
    private readonly incomeRepository: IncomeRepository,
    private readonly pocketRepository: PocketRepository,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    userId: string,
    id: string,
    dto: { amount: number; reason: string; date?: string },
  ): Promise<AdjustmentResult> {
    const original = await this.incomeRepository.findById(id, userId);
    if (!original) {
      throw new Error("Income not found");
    }

    const delta = dto.amount - original.amount;
    if (delta === 0) {
      throw new Error("New amount must differ from original");
    }

    const date = dto.date ? new Date(dto.date + "T12:00:00.000Z") : new Date();

    // Pro-rata distribution (compute with positive delta, negate if reducing)
    const allocations = original.allocations || [];
    const absDelta = Math.abs(delta);
    const rawAllocs = computeProRata(absDelta, allocations);
    const proRataAllocs = delta < 0
      ? rawAllocs.map((a) => ({ ...a, amount: -a.amount }))
      : rawAllocs;

    // Goal overflow check (only relevant when delta > 0 — allocating more)
    if (delta > 0) {
      await this.checkGoalOverflow(userId, proRataAllocs, original);
    }

    return this.createIncomeAdjustment(userId, id, delta, dto.reason, date, proRataAllocs);
  }

  private async checkGoalOverflow(
    userId: string,
    allocations: { pocketId: string | null; amount: number }[],
    original: Income,
  ): Promise<void> {
    const oldAllocsByPocket = new Map<string, number>();
    for (const alloc of original.allocations || []) {
      if (alloc.pocketId) {
        oldAllocsByPocket.set(alloc.pocketId, alloc.amount);
      }
    }

    for (const alloc of allocations) {
      if (!alloc.pocketId) continue;
      const pocket = await this.pocketRepository.findById(alloc.pocketId, userId);
      if (!pocket || pocket.type !== "goal" || pocket.goal <= 0) continue;

      const oldAmount = oldAllocsByPocket.get(alloc.pocketId) || 0;
      const wouldBeAccumulated = pocket.accumulatedAmount + alloc.amount - oldAmount;
      if (wouldBeAccumulated > pocket.goal) {
        throw new Error(
          `goal overflow:${pocket.id}:${pocket.name}:goal=${pocket.goal}:wouldBe=${wouldBeAccumulated}`,
        );
      }
    }
  }

  private async createIncomeAdjustment(
    userId: string,
    originalId: string,
    amount: number,
    reason: string,
    date: Date,
    proRataAllocs: { pocketId: string | null; amount: number }[],
  ): Promise<AdjustmentResult> {
    return this.dataSource.transaction(async (em) => {
      const entity = em.create(IncomeEntity, {
        userId,
        amount,
        reason: `[Ajuste] ${reason}`,
        date,
        isAdjustment: true,
        adjustedRecordId: originalId,
      });
      const saved = await em.save(IncomeEntity, entity);

      const allocEntities = proRataAllocs
        .filter((a) => a.pocketId)
        .map((alloc) =>
          em.create(IncomeAllocationEntity, {
            incomeId: saved.id,
            pocketId: alloc.pocketId!,
            amount: alloc.amount,
          }),
        );
      await em.save(IncomeAllocationEntity, allocEntities);

      return {
        type: "income",
        amount,
        adjustedRecordId: originalId,
        isAdjustment: true,
        reason: `[Ajuste] ${reason}`,
        date,
        allocations: proRataAllocs,
      };
    });
  }
}
