import { DebtService } from "../../domain/services/debt.service";

export class GetMonthlySummaryUseCase {
  constructor(private readonly debtService: DebtService) {}

  async execute(
    userId: string,
    year: number,
    month: number,
  ): Promise<{
    month: string;
    totalAmount: number;
    totalRemaining: number;
    debtCount: number;
    fullyPaidCount: number;
    activeCount: number;
    byLender: Record<string, number>;
    byDay: Record<string, number>;
  }> {
    return await this.debtService.getMonthlySummary(userId, year, month);
  }
}
