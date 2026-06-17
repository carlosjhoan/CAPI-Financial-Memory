import { ExpenseService } from "../../domain/services/expense.service";

export class GetYearlySummaryUseCase {
  constructor(private readonly expenseService: ExpenseService) {}

  async execute(userId: string, year: number): Promise<{
    year: number;
    totalAmount: number;
    monthlyBreakdown: Record<string, number>;
    averageMonthly: number;
  }> {
    return await this.expenseService.getYearlySummary(userId, year);
  }
}