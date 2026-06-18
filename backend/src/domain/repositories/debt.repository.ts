import { Debt } from "../entities/debt.entity";
import { DebtQueryDto } from "../../infrastructure/web/dto/debt-query.dto";

export interface DebtRepository {
  save(debt: Debt): Promise<Debt>;
  findById(id: string, userId?: string): Promise<Debt | null>;
  findAll(userId: string): Promise<Debt[]>;
  findAllPaginated(
    query: DebtQueryDto,
    userId?: string,
  ): Promise<{ data: Debt[]; total: number }>;
  findByDateRange(
    startDate: Date,
    endDate: Date,
    userId?: string,
  ): Promise<Debt[]>;
  getMonthlySummary(
    year: number,
    month: number,
    userId?: string,
  ): Promise<{
    totalAmount: number;
    count: number;
    byLender: Record<string, number>;
  }>;
  getYearlySummary(
    year: number,
    userId?: string,
  ): Promise<{
    monthlyBreakdown: { month: number; total: number; count: number }[];
  }>;
  update(debt: Debt): Promise<Debt>;
  delete(id: string, userId?: string): Promise<void>;
}
