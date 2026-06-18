import { IncomeService } from "../../domain/services/income.service";

export class GetMonthlySummaryUseCase {
  constructor(private readonly incomeService: IncomeService) {}

  async execute(
    userId: string,
    year: number,
    month: number,
  ): Promise<{
    month: string;
    totalAmount: number;
    incomeCount: number;
    dailyBreakdown: Record<string, number>;
    byReason: Record<string, number>;
  }> {
    return await this.incomeService.getMonthlySummary(userId, year, month);
  }
}
