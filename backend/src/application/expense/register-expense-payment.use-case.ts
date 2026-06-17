import { Expense } from "../../domain/entities/expense.entity";
import { ExpenseRepository } from "../../domain/repositories/expense.repository";

export class RegisterExpensePaymentUseCase {
  constructor(private readonly expenseRepository: ExpenseRepository) {}

  async execute(userId: string, expenseId: string, amount: number): Promise<Expense> {
    if (amount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }

    const expense = await this.expenseRepository.findById(expenseId, userId);

    if (!expense) {
      throw new Error("Expense not found");
    }

    // Logic to process the payment (if applicable)
    expense.update(expense.amount + amount, expense.reason, expense.date);
    return await this.expenseRepository.update(expense);
  }
}
