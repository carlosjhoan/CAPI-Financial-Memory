import { DebtService } from "../../domain/services/debt.service";

export class DeleteDebtUseCase {
  constructor(private readonly debtService: DebtService) {}

  async execute(userId: string, id: string): Promise<void> {
    return await this.debtService.deleteDebt(userId, id);
  }
}