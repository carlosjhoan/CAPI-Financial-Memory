import { Income } from "../../domain/entities/income.entity";
import { IncomeService } from "../../domain/services/income.service";

export class GetIncomeByIdUseCase {
  constructor(private readonly incomeService: IncomeService) {}

  async execute(userId: string, id: string): Promise<Income> {
    return await this.incomeService.getIncomeById(userId, id);
  }
}