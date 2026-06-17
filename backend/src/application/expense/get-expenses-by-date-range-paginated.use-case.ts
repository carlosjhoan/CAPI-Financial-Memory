import { Expense } from "../../domain/entities/expense.entity";
import { ExpenseService } from "../../domain/services/expense.service";

export class GetExpensesByDateRangePaginatedUseCase {
  constructor(private readonly expenseService: ExpenseService) {}

  async execute(
    userId: string,
    startDate: Date,
    endDate: Date,
    skip: number,
    limit: number,
  ): Promise<{ data: Expense[]; total: number }> {
    return await this.expenseService.getExpensesByDateRangePaginated(
      userId,
      startDate,
      endDate,
      skip,
      limit,
    );
  }
}