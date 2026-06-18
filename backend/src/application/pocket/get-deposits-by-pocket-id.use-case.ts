import { Deposit } from "../../domain/entities/deposit.entity";
import { PocketService } from "../../domain/services/pocket.service";

export class GetDepositsByPocketIdUseCase {
  constructor(private readonly pocketService: PocketService) {}

  async execute(
    userId: string,
    pocketId: string,
    options?: { offset?: number; limit?: number },
  ): Promise<Deposit[]> {
    return await this.pocketService.getDepositsByPocketId(
      userId,
      pocketId,
      options,
    );
  }
}
