import { Income } from "../../domain/entities/income.entity";
import { IncomeService } from "../../domain/services/income.service";

export class GetAllIncomesUseCase {
  constructor(private readonly incomeService: IncomeService) {}

  async execute(userId: string): Promise<Income[]> {
    return await this.incomeService.getAllIncomes(userId);
  }

  async executePaginated(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<{ data: Income[]; total: number }> {
    return await this.incomeService.getAllIncomesPaginated(userId, skip, limit);
  }
}
