import { LoanService } from "../../domain/services/loan.service";

export class GetYearlySummaryUseCase {
  constructor(private readonly loanService: LoanService) {}

  async execute(userId: string, year: number): Promise<{
    year: number;
    totalAmountLent: number;
    totalInterest: number;
    totalReceived: number;
    totalPending: number;
    count: number;
    fullyPaidCount: number;
    activeCount: number;
    monthlyBreakdown: Record<string, number>;
    averageMonthly: number;
  }> {
    return await this.loanService.getYearlySummary(userId, year);
  }
}