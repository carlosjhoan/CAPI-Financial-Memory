import { Loan } from "../../domain/entities/loan.entity";
import { LoanRepository } from "../../domain/repositories/loan.repository";

export class RegisterLoanPaymentUseCase {
  constructor(private readonly loanRepository: LoanRepository) {}

  async execute(userId: string, loanId: string, amount: number): Promise<Loan> {
    if (amount <= 0) {
      throw new Error("Payment amount must be greater than 0");
    }

    const loan = await this.loanRepository.findById(loanId, userId);

    if (!loan) {
      throw new Error("Loan not found");
    }

    // Logic to process the payment (if applicable)
    loan.registerPayment(amount);
    return await this.loanRepository.update(loan);
  }
}
