import { Expense } from "../../domain/entities/expense.entity";
import { ExpenseService } from "../../domain/services/expense.service";

export class GetExpenseByIdUseCase {
  constructor(private readonly expenseService: ExpenseService) {}

  async execute(userId: string, id: string): Promise<Expense> {
    return await this.expenseService.getExpenseById(userId, id);
  }
}