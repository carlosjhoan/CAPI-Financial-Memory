import { Loan } from "../../domain/entities/loan.entity";
import { LoanService } from "../../domain/services/loan.service";
import { LoanQueryDto } from "../../infrastructure/web/dto/loan-query.dto";

export class GetAllLoansPaginatedUseCase {
  constructor(private readonly loanService: LoanService) {}

  async execute(
    userId: string,
    query: LoanQueryDto,
  ): Promise<{ data: Loan[]; total: number }> {
    return await this.loanService.getAllLoansPaginated(userId, query);
  }
}