import { LoanService } from "../../domain/services/loan.service";

export class GetMonthlySummaryUseCase {
  constructor(private readonly loanService: LoanService) {}

  async execute(
    userId: string,
    year: number,
    month: number,
  ): Promise<{
    month: string;
    totalAmountLent: number;
    totalInterest: number;
    totalReceived: number;
    totalPending: number;
    loanCount: number;
    fullyPaidCount: number;
    activeCount: number;
    byDebtor: Record<string, number>;
    byDay: Record<string, number>;
  }> {
    return await this.loanService.getMonthlySummary(userId, year, month);
  }
}
