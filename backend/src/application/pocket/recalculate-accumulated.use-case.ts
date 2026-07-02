import { PocketRepository } from "../../domain/repositories/pocket.repository";
import { Pocket } from "../../domain/entities/pocket.entity";

interface PocketResult {
  id: string;
  name: string;
  accumulatedAmount: number;
}

interface RecalculateResult {
  totalPockets: number;
  totalAccumulated: number;
  details: PocketResult[];
}

export class RecalculateAccumulatedUseCase {
  constructor(private readonly pocketRepository: PocketRepository) {}

  async execute(userId: string): Promise<RecalculateResult> {
    const pockets = await this.pocketRepository.findAll(userId);

    const details: PocketResult[] = pockets.map((p) => ({
      id: p.id,
      name: p.name,
      accumulatedAmount: p.accumulatedAmount,
    }));

    return {
      totalPockets: pockets.length,
      totalAccumulated: details.reduce((s, d) => s + d.accumulatedAmount, 0),
      details,
    };
  }
}
