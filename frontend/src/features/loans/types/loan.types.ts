import { BaseFilters } from '../../../core/types/base.types';

// ==========================================
// LOAN TYPES
// ==========================================

export interface Loan {
  id: string;
  initialAmount: number;
  interestRate: number;      // porcentaje (ej: 5.5 = 5.5%)
  installment: number;       // cuota mensual
  paidAmount: number;
  remainingAmount: number;   // initialAmount * (1 + interestRate/100) - paidAmount
  debtor: string;            // quien me debe
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLoanDto {
  initialAmount: number;
  interestRate: number;
  installment: number;
  debtor: string;
  date: string;
}

export interface UpdateLoanDto {
  interestRate?: number;
  installment?: number;
  debtor?: string;
}

// LoanFilters extiende BaseFilters
export interface LoanFilters extends BaseFilters {
  debtor?: string;
  status?: 'active' | 'paid';
}

export interface LoanPayment {
  id: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface LoanOverallSummary {
  totalLoans: number;
  totalAmountLent: number;
  totalInterest: number;
  totalExpectedReturn: number;
  totalReceived: number;
  totalPending: number;
  fullyPaidCount: number;
  activeLoansCount: number;
}

export interface LoanPerformance {
  monthsSinceStart: number;
  expectedPayments: number;
  actualPayments: number;
  paymentRatio: number;
  isOnTrack: boolean;
  monthsBehind: number;
  expectedCompletionDate: string;
}

export interface MonthlySummary {
  month: string;
  totalAmountLent: number;
  totalInterest: number;
  totalReceived: number;
  totalPending: number;
  loanCount: number;
  fullyPaidCount: number;
  activeCount: number;
  byDebtor: Record<string, number>;
  byDay: Record<string, number>;
}

export interface YearlySummary {
  year: number;
  totalAmountLent: number;
  totalInterest: number;
  totalReceived: number;
  totalPending: number;
  count: number;
  fullyPaidCount: number;
  activeCount: number;
  monthlyBreakdown: Record<string, number>;
  averageMonthly: number;
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
