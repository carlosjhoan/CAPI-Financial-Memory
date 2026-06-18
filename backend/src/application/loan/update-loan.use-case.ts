import { Loan } from "../../domain/entities/loan.entity";
import { LoanService } from "../../domain/services/loan.service";

export class UpdateLoanUseCase {
  constructor(private readonly loanService: LoanService) {}

  async execute(
    userId: string,
    id: string,
    updates: {
      interestRate?: number;
      installment?: number;
      debtor?: string;
    },
  ): Promise<Loan> {
    return await this.loanService.updateLoan(userId, id, updates);
  }
}
