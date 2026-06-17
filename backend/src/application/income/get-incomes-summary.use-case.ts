import { Income } from "../../domain/entities/income.entity";
import { IncomeService } from "../../domain/services/income.service";

export class GetIncomesSummaryUseCase {
  constructor(private readonly incomeService: IncomeService) {}

  async execute(
    userId: string,
    filters?: { startDate?: string; endDate?: string },
  ): Promise<{
    totalIncomes: number;
    totalAmount: number;
    averageAmount: number;
    highestIncome: Income | null;
    recentIncomes: Income[];
  }> {
    return await this.incomeService.getIncomesSummary(
      userId,
      filters?.startDate,
      filters?.endDate,
    );
  }
}