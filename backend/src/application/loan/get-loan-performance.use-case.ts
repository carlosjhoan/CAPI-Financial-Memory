import { LoanService } from "../../domain/services/loan.service";

export class GetLoanPerformanceUseCase {
  constructor(private readonly loanService: LoanService) {}

  async execute(userId: string, loanId: string): Promise<{
    loan: any;
    monthsSinceStart: number;
    expectedPayments: number;
    actualPayments: number;
    paymentRatio: number;
    isOnTrack: boolean;
    monthsBehind: number;
    expectedCompletionDate: Date;
  }> {
    return await this.loanService.getLoanPerformance(userId, loanId);
  }
}