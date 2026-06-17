import { Income } from "../../domain/entities/income.entity";
import { IncomeService } from "../../domain/services/income.service";

export class GetIncomesByDateRangePaginatedUseCase {
  constructor(private readonly incomeService: IncomeService) {}

  async execute(
    userId: string,
    startDate: Date,
    endDate: Date,
    skip: number,
    limit: number,
  ): Promise<{ data: Income[]; total: number }> {
    return await this.incomeService.getIncomesByDateRangePaginated(userId, startDate, endDate, skip, limit);
  }
}