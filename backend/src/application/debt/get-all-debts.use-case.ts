import { Debt } from "../../domain/entities/debt.entity";
import { DebtService } from "../../domain/services/debt.service";

export class GetAllDebtsUseCase {
  constructor(private readonly debtService: DebtService) {}

  async execute(userId: string): Promise<Debt[]> {
    return await this.debtService.getAllDebts(userId);
  }
}
