import { Loan } from "../entities/loan.entity";
import { LoanQueryDto } from "../../infrastructure/web/dto/loan-query.dto";

export interface LoanRepository {
  save(loan: Loan): Promise<Loan>;
  findById(id: string, userId?: string): Promise<Loan | null>;
  findAll(userId: string): Promise<Loan[]>;
  findAllPaginated(
    query: LoanQueryDto,
    userId?: string,
  ): Promise<{ data: Loan[]; total: number }>;
  findByDebtor(debtor: string, userId?: string): Promise<Loan[]>;
  findActiveLoans(userId?: string): Promise<Loan[]>;
  findFullyPaidLoans(userId?: string): Promise<Loan[]>;
  getLoansSummary(userId?: string): Promise<{
    totalLoans: number;
    totalAmountLent: number;
    totalInterest: number;
    totalExpectedReturn: number;
    totalReceived: number;
    totalPending: number;
    fullyPaidCount: number;
    activeLoansCount: number;
  }>;
  getOverdueLoans(userId?: string): Promise<Loan[]>;
  getLoansByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<Loan[]>;
  update(loan: Loan): Promise<Loan>;
  delete(id: string, userId?: string): Promise<void>;
}
