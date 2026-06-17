import { Income } from "../../domain/entities/income.entity";
import { IncomeService } from "../../domain/services/income.service";

export class GetIncomesByDateRangeUseCase {
  constructor(private readonly incomeService: IncomeService) {}

  async execute(userId: string, startDate: Date, endDate: Date): Promise<Income[]> {
    return await this.incomeService.getIncomesByDateRange(userId, startDate, endDate);
  }
}