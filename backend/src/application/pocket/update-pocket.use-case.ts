import { Pocket } from "../../domain/entities/pocket.entity";
import { PocketService } from "../../domain/services/pocket.service";

export class UpdatePocketUseCase {
  constructor(private readonly pocketService: PocketService) {}

  async execute(
    userId: string,
    id: string,
    updates: {
      name?: string;
      type?: "goal" | "deposit";
      goal?: number;
      accumulatedAmount?: number;
      motivation?: string;
    },
  ): Promise<Pocket> {
    return await this.pocketService.updatePocket(userId, id, updates);
  }
}
