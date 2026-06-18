import { Debt } from "../../domain/entities/debt.entity";
import { DebtService } from "../../domain/services/debt.service";

export class GetDebtByIdUseCase {
  constructor(private readonly debtService: DebtService) {}

  async execute(userId: string, id: string): Promise<Debt> {
    return await this.debtService.getDebtById(userId, id);
  }
}
