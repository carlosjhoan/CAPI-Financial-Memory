import { Income } from "../../domain/entities/income.entity";
import { IncomeRepository } from "../../domain/repositories/income.repository";

export class RegisterIncomePaymentUseCase {
  constructor(private readonly incomeRepository: IncomeRepository) {}

  async execute(
    userId: string,
    incomeId: string,
    amount: number,
  ): Promise<Income> {
    if (amount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }

    const income = await this.incomeRepository.findById(incomeId, userId);

    if (!income) {
      throw new Error("Income not found");
    }

    income.update(income.amount + amount, income.reason, income.date);
    return await this.incomeRepository.update(income);
  }
}
