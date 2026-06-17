import { Pocket } from "../../domain/entities/pocket.entity";
import { PocketRepository } from "../../domain/repositories/pocket.repository";

export class CreatePocketUseCase {
  constructor(private readonly pocketRepository: PocketRepository) {}

  async execute(
    userId: string,
    name: string,
    type: "goal" | "deposit",
    goal: number,
    accumulatedAmount: number,
    motivation: string,
    initialAmount?: number,
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

    const finalMotivation = motivation && motivation.trim().length > 0
      ? motivation.trim()
      : 'Quiero ahorrar para algo que aún no sé qué es';

    const pocket = new Pocket(name, type, goal, accumulatedAmount, finalMotivation, undefined, userId);
    pocket.initialAmount = initialAmount ?? accumulatedAmount;
    return await this.pocketRepository.save(pocket);
  }
}
