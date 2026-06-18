import { LoanService } from "../../domain/services/loan.service";

export class GetLoansSummaryUseCase {
  constructor(private readonly loanService: LoanService) {}

  async execute(
    userId: string,
    filters?: { startDate?: string; endDate?: string },
  ): Promise<{
    totalLoans: number;
    totalAmountLent: number;
    totalInterest: number;
    totalExpectedReturn: number;
    totalReceived: number;
    totalPending: number;
    fullyPaidCount: number;
    activeLoansCount: number;
  }> {
    return await this.loanService.getLoansSummary(
      userId,
      filters?.startDate,
      filters?.endDate,
    );
  }
}
