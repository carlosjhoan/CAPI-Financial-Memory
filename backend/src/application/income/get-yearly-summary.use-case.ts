import { IncomeService } from "../../domain/services/income.service";

export class GetYearlySummaryUseCase {
  constructor(private readonly incomeService: IncomeService) {}

  async execute(userId: string, year: number): Promise<{
    year: number;
    totalAmount: number;
    monthlyBreakdown: Record<string, number>;
    averageMonthly: number;
  }> {
    return await this.incomeService.getYearlySummary(userId, year);
  }
}