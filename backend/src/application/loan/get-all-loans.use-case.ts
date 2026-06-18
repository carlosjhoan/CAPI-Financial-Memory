import { Loan } from "../../domain/entities/loan.entity";
import { LoanService } from "../../domain/services/loan.service";

export class GetAllLoansUseCase {
  constructor(private readonly loanService: LoanService) {}

  async execute(userId: string): Promise<Loan[]> {
    return await this.loanService.getAllLoans(userId);
  }
}
