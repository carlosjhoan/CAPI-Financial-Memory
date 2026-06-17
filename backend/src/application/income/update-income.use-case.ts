import { Income } from "../../domain/entities/income.entity";
import { IncomeService } from "../../domain/services/income.service";

export class UpdateIncomeUseCase {
  constructor(private readonly incomeService: IncomeService) {}

  async execute(
    userId: string,
    id: string,
    updates: {
      amount?: number;
      reason?: string;
      date?: Date;
    },
  ): Promise<Income> {
    return await this.incomeService.updateIncome(userId, id, updates);
  }
}