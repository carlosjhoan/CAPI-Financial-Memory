import { ExpenseService } from "../../domain/services/expense.service";

export class GetMonthlySummaryUseCase {
  constructor(private readonly expenseService: ExpenseService) {}

  async execute(
    userId: string,
    year: number,
    month: number,
  ): Promise<{
    month: string;
    totalAmount: number;
    expenseCount: number;
    dailyBreakdown: Record<string, number>;
  }> {
    return await this.expenseService.getMonthlySummary(userId, year, month);
  }
}