import { PocketService } from "../../domain/services/pocket.service";

export class GetPocketsSummaryUseCase {
  constructor(private readonly pocketService: PocketService) {}

  async execute(
    userId: string,
  ): Promise<{ totalAccumulated: number; totalGoal: number; count: number }> {
    return await this.pocketService.getPocketsSummary(userId);
  }
}
