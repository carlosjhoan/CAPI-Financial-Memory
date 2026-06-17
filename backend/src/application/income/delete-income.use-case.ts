import { IncomeService } from "../../domain/services/income.service";

export class DeleteIncomeUseCase {
  constructor(private readonly incomeService: IncomeService) {}

  async execute(userId: string, id: string): Promise<void> {
    return await this.incomeService.deleteIncome(userId, id);
  }
}