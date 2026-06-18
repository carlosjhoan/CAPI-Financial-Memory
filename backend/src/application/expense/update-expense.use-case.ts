import { Expense } from "../../domain/entities/expense.entity";
import { ExpenseService } from "../../domain/services/expense.service";

export class UpdateExpenseUseCase {
  constructor(private readonly expenseService: ExpenseService) {}

  async execute(
    userId: string,
    id: string,
    updates: {
      amount?: number;
      reason?: string;
      date?: Date;
    },
  ): Promise<Expense> {
    return await this.expenseService.updateExpense(userId, id, updates);
  }
}
