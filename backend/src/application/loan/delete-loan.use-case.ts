import { LoanService } from "../../domain/services/loan.service";

export class DeleteLoanUseCase {
  constructor(private readonly loanService: LoanService) {}

  async execute(userId: string, id: string): Promise<void> {
    return await this.loanService.deleteLoan(userId, id);
  }
}