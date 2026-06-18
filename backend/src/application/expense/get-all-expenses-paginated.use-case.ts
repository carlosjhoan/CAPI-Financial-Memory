import { Expense } from "../../domain/entities/expense.entity";
import { ExpenseService } from "../../domain/services/expense.service";

export class GetAllExpensesPaginatedUseCase {
  constructor(private readonly expenseService: ExpenseService) {}

  async execute(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<{ data: Expense[]; total: number }> {
    return await this.expenseService.getAllExpensesPaginated(
      userId,
      skip,
      limit,
    );
  }
}
