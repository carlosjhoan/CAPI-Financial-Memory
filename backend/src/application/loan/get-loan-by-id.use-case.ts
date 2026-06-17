import { Loan } from "../../domain/entities/loan.entity";
import { LoanService } from "../../domain/services/loan.service";

export class GetLoanByIdUseCase {
  constructor(private readonly loanService: LoanService) {}

  async execute(userId: string, id: string): Promise<Loan> {
    return await this.loanService.getLoanById(userId, id);
  }
}