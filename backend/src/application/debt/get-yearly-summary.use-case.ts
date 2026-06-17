import { DebtService } from "../../domain/services/debt.service";

export class GetYearlySummaryUseCase {
  constructor(private readonly debtService: DebtService) {}

  async execute(userId: string, year: number): Promise<{
    year: number;
    totalAmount: number;
    totalRemaining: number;
    count: number;
    fullyPaidCount: number;
    activeCount: number;
    monthlyBreakdown: Record<string, number>;
    averageMonthly: number;
  }> {
    return await this.debtService.getYearlySummary(userId, year);
  }
}