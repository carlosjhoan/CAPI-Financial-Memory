import { Debt } from "../../domain/entities/debt.entity";
import { DebtRepository } from "../../domain/repositories/debt.repository";

export class RegisterPaymentUseCase {
  constructor(private readonly debtRepository: DebtRepository) {}

  async execute(
    userId: string,
    debtId: string,
    amount: number,
    date?: Date,
  ): Promise<Debt> {
    if (amount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }

    const debt = await this.debtRepository.findById(debtId, userId);

    if (!debt) {
      throw new Error("Debt not found");
    }

    if (debt.isFullyPaid()) {
      throw new Error("Debt is already fully paid");
    }

    debt.registerPayment(amount, date);

    return await this.debtRepository.update(debt);
  }
}
