import { Expense } from "../entities/expense.entity";

export interface ExpenseRepository {
  save(expense: Expense): Promise<Expense>;
  findById(id: string, userId?: string): Promise<Expense | null>;
  findAll(userId: string): Promise<Expense[]>;
  findAllPaginated(
    skip: number,
    limit: number,
    userId?: string,
  ): Promise<{ data: Expense[]; total: number }>;
  findByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<Expense[]>;
  findByDateRangePaginated(
    startDate: Date,
    endDate: Date,
    skip: number,
    limit: number,
    userId?: string,
  ): Promise<{ data: Expense[]; total: number }>;
  update(expense: Expense): Promise<Expense>;
  delete(id: string, userId?: string): Promise<void>;
  getMonthlySummary(
    year: number,
    month: number,
    userId?: string,
  ): Promise<{
    totalAmount: number;
    count: number;
    averageAmount: number;
  }>;
  getYearlySummary(year: number, userId?: string): Promise<{
    totalAmount: number;
    count: number;
    monthlyBreakdown: Record<string, number>;
  }>;
}
