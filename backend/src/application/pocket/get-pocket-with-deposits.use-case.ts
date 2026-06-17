import { Pocket } from "../../domain/entities/pocket.entity";
import { Deposit } from "../../domain/entities/deposit.entity";
import { Expense } from "../../domain/entities/expense.entity";
import { PocketService } from "../../domain/services/pocket.service";

export class GetPocketWithDepositsUseCase {
  constructor(private readonly pocketService: PocketService) {}

  async execute(userId: string, id: string): Promise<{ pocket: Pocket; deposits: Deposit[]; expenses: Expense[] }> {
    return await this.pocketService.getPocketWithDeposits(userId, id);
  }
}
