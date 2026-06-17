import { Loan } from "../../domain/entities/loan.entity";
import { LoanRepository } from "../../domain/repositories/loan.repository";

export class CreateLoanUseCase {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(
    userId: string,
    initialAmount: number,
    interestRate: number,
    installment: number,
    debtor: string,
    date: Date,
  ): Promise<Loan> {
    if (initialAmount <= 0) {
      throw new Error("Initial amount must be greater than 0");
    }

    if (interestRate < 0) {
      throw new Error("Interest rate cannot be negative");
    }

    if (installment <= 0) {
      throw new Error("Installment must be greater than 0");
    }

    if (!debtor || debtor.trim().length === 0) {
      throw new Error("Debtor is required");
    }

    const loan = new Loan(
      initialAmount,
      interestRate,
      installment,
      debtor,
      date,
      undefined,
      userId,
    );
    return await this.loanRepository.save(loan);
  }
}
