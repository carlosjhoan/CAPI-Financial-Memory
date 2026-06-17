import { BaseFilters } from '../../../core/types/base.types';

// ==========================================
// INCOME TYPES
// ==========================================

export interface Income {
  id: string;
  amount: number;
  reason: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface Allocation {
  pocketId: string;
  amount: number;
}

export interface CreateIncomeDto {
  amount: number;
  reason: string;
  date: string;
  allocations?: Allocation[];
}

export interface UpdateIncomeDto {
  amount?: number;
  reason?: string;
  date?: string;
  allocations?: Allocation[];
}

// IncomeFilters extiende BaseFilters (startDate, endDate, year, month)
export type IncomeFilters = BaseFilters;

export interface MonthlySummary {
  month: string;
  totalAmount: number;
  incomeCount: number;
  dailyBreakdown: Record<string, number>;
  byReason: Record<string, number>;
}

export interface YearlySummary {
  year: number;
  totalAmount: number;
  count: number;
  monthlyBreakdown: Record<string, number>;
  averageMonthly: number;
}

export interface OverallSummary {
  totalIncomes: number;
  totalAmount: number;
  averageAmount: number;
  highestIncome: Income | null;
  recentIncomes: Income[];
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}