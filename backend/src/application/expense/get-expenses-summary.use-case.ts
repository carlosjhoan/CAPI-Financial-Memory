import { Expense } from "../../domain/entities/expense.entity";
import { ExpenseService } from "../../domain/services/expense.service";

export class GetExpensesSummaryUseCase {
  constructor(private readonly expenseService: ExpenseService) {}

  async execute(
    userId: string,
    filters?: { startDate?: string; endDate?: string },
  ): Promise<{
    totalExpenses: number;
    totalAmount: number;
    averageAmount: number;
    mostExpensive: Expense | null;
    recentExpenses: Expense[];
  }> {
    return await this.expenseService.getExpensesSummary(
      userId,
      filters?.startDate,
      filters?.endDate,
    );
  }
}