import { Debt } from "../../domain/entities/debt.entity";
import { DebtRepository } from "../../domain/repositories/debt.repository";

export class CreateDebtUseCase {
  constructor(private readonly debtRepository: DebtRepository) {}

  async execute(
    userId: string,
    initialAmount: number,
    lender: string,
    months: number,
    installAmount: number,
    finalAmount: number,
    date: Date,
    reason: string,
  ): Promise<Debt> {
    // Validaciones de negocio
    if (initialAmount <= 0) {
      throw new Error("Initial amount must be greater than 0");
    }

    if (finalAmount <= 0) {
      throw new Error("Final amount must be greater than 0");
    }

    if (finalAmount < initialAmount) {
      throw new Error("Deuda inconsistente: Monto final menor que el inicial");
    }

    if (months <= 0) {
      throw new Error("Months must be greater than 0");
    }

    if (installAmount <= 0) {
      throw new Error("Installment amount must be greater than 0");
    }

    if (!lender || lender.trim().length === 0) {
      throw new Error("Lender is required");
    }

    const finalReason = reason && reason.trim().length > 0
      ? reason.trim()
      : 'Me endeudé y no sé ni para qué';

    const debt = new Debt(
      initialAmount,
      lender,
      months,
      installAmount,
      finalAmount,
      date,
      finalReason,
      undefined,
      userId,
    );

    return await this.debtRepository.save(debt);
  }
}
