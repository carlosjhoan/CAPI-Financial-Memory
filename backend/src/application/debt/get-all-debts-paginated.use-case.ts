import { Debt } from "../../domain/entities/debt.entity";
import { DebtService } from "../../domain/services/debt.service";
import { DebtQueryDto } from "../../infrastructure/web/dto/debt-query.dto";

export class GetAllDebtsPaginatedUseCase {
  constructor(private readonly debtService: DebtService) {}

  async execute(userId: string, query: DebtQueryDto): Promise<{ data: Debt[]; total: number }> {
    return await this.debtService.getAllDebtsPaginated(userId, query);
  }
}