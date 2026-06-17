import { ExpenseService } from "../../domain/services/expense.service";

export class DeleteExpenseUseCase {
  constructor(private readonly expenseService: ExpenseService) {}

  async execute(userId: string, id: string): Promise<void> {
    await this.expenseService.deleteExpense(userId, id);
  }
}