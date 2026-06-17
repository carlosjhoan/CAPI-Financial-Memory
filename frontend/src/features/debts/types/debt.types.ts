import { BaseFilters } from '../../../core/types/base.types';

export interface Payment {
  id: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  initialAmount: number;
  lender: string;
  months: number;
  installAmount: number;
  finalAmount: number;
  paidAmount: number;
  date: string;
  lastPaymentDate?: string;
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
  reason: string;
}

export interface CreateDebtDto {
  initialAmount: number;
  lender: string;
  months: number;
  installAmount: number;
  finalAmount: number;
  date: string;
  reason: string;
}

export interface UpdateDebtDto {
  initialAmount?: number;
  lender?: string;
  months?: number;
  installAmount?: number;
  finalAmount?: number;
  reason?: string;
}

export interface DebtPayment {
  debtId: string;
  amount: number;
  date: string;
}

// DebtFilters extiende BaseFilters (startDate, endDate, year, month)
export interface DebtFilters extends BaseFilters {
  status?: 'active' | 'paid';
  lender?: string;
}

export interface DebtSummary {
  totalDebt: number;
  totalPaid: number;
  remainingDebt: number;
  debtCount: number;
}

export interface DebtMonthlySummary {
  month: string;
  totalAmount: number;
  totalRemaining: number;
  debtCount: number;
  fullyPaidCount: number;
  activeCount: number;
  byLender: Record<string, number>;
}

export interface DebtYearlySummary {
  year: number;
  totalAmount: number;
  totalRemaining: number;
  count: number;
  fullyPaidCount: number;
  activeCount: number;
  averageAmount: number;
  monthlyBreakdown: Record<string, number>;
}

export interface DebtOverallSummary {
  totalDebts: number;
  totalAmount: number;
  totalPaid: number;
  totalRemaining: number;
  fullyPaidCount: number;
  activeDebtsCount: number;
}

export interface DebtQueryFilters {
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
  lender?: string;
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