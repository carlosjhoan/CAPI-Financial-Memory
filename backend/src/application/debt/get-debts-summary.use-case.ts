import { DebtService } from "../../domain/services/debt.service";

export class GetDebtsSummaryUseCase {
  constructor(private readonly debtService: DebtService) {}

  async execute(
    userId: string,
    filters?: { startDate?: string; endDate?: string },
  ): Promise<{
    totalDebts: number;
    totalAmount: number;
    totalPaid: number;
    totalRemaining: number;
    fullyPaidCount: number;
    activeDebtsCount: number;
  }> {
    return await this.debtService.getDebtsSummary(
      userId,
      filters?.startDate,
      filters?.endDate,
    );
  }
}