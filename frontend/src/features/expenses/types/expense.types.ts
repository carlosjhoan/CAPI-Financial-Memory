import { BaseFilters } from '../../../core/types/base.types';

// ==========================================
// EXPENSE TYPES
// ==========================================

export interface Expense {
  id: string;
  amount: number;
  reason: string;
  date: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Allocation {
  pocketId: string;
  amount: number;
}

export interface CreateExpenseDto {
  amount: number;
  reason: string;
  date: string;
  allocations?: Allocation[];
}

export interface UpdateExpenseDto {
  amount?: number;
  reason?: string;
  date?: string;
  allocations?: Allocation[];
}

// ExpenseFilters extiende BaseFilters (startDate, endDate, year, month)
export type ExpenseFilters = BaseFilters;

export interface MonthlySummary {
  month: string;
  totalAmount: number;
  expenseCount: number;
  dailyBreakdown: Record<string, number>;
}

export interface YearlySummary {
  year: number;
  totalAmount: number;
  count: number;
  monthlyBreakdown: Record<string, number>;
  averageMonthly: number;
}

export interface OverallSummary {
  totalExpenses: number;
  totalAmount: number;
  averageAmount: number;
  mostExpensive: Expense | null;
  recentExpenses: Expense[];
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
