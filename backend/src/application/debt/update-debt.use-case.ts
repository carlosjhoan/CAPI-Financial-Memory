import { Debt } from "../../domain/entities/debt.entity";
import { DebtService } from "../../domain/services/debt.service";

export class UpdateDebtUseCase {
  constructor(private readonly debtService: DebtService) {}

  async execute(
    userId: string,
    id: string,
    updates: {
      lender?: string;
      months?: number;
      installAmount?: number;
      finalAmount?: number;
      initialAmount?: number;
      reason?: string;
    },
  ): Promise<Debt> {
    return await this.debtService.updateDebt(userId, id, updates);
  }
}