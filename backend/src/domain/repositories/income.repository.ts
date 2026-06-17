import { Income } from "../entities/income.entity";

export interface IncomeRepository {
  save(income: Income): Promise<Income>;
  findById(id: string, userId?: string): Promise<Income | null>;
  findAll(userId: string): Promise<Income[]>;
  findAllPaginated(
    skip: number,
    limit: number,
    userId?: string,
  ): Promise<{ data: Income[]; total: number }>;
  findByDateRange(startDate: Date, endDate: Date, userId?: string): Promise<Income[]>;
  findByDateRangePaginated(
    startDate: Date,
    endDate: Date,
    skip: number,
    limit: number,
    userId?: string,
  ): Promise<{ data: Income[]; total: number }>;
  update(income: Income): Promise<Income>;
  delete(id: string, userId?: string): Promise<void>;
}
