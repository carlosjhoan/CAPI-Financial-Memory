import { createApiService, customRequest, PaginatedResult } from './factory';
import { apiClient } from './client';
import type { ApiResponse } from '../types/api.types';
import type { Income, CreateIncomeDto, UpdateIncomeDto, IncomeFilters, MonthlySummary, YearlySummary, OverallSummary } from '../../features/incomes/types/income.types';
import type { Debt, CreateDebtDto, UpdateDebtDto, DebtFilters, DebtMonthlySummary, DebtYearlySummary, DebtOverallSummary, Payment } from '../../features/debts/types/debt.types';
import type { Expense, CreateExpenseDto, UpdateExpenseDto, ExpenseFilters } from '../../features/expenses/types/expense.types';
import type {
  MonthlySummary as ExpenseMonthlySummary,
  YearlySummary as ExpenseYearlySummary,
  OverallSummary as ExpenseOverallSummary,
} from '../../features/expenses/types/expense.types';
import type { Loan, CreateLoanDto, UpdateLoanDto, LoanFilters, LoanOverallSummary, LoanPerformance, MonthlySummary as LoanMonthlySummary, YearlySummary as LoanYearlySummary } from '../../features/loans/types/loan.types';
import type { Pocket, CreatePocketDto, UpdatePocketDto, PocketsSummary, TransferDto, DistributionItem, DeleteWithTransferDto } from '../../features/pockets/types/pocket.types';

// ==========================================
// AUTH SERVICE (special case - no ApiResponse wrapper)
// ==========================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface GoogleAuthRequest {
  credential: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    provider: 'local' | 'google';
  };
}

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  async googleAuth(data: GoogleAuthRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/google', data);
    return response.data;
  },

  async getProfile(): Promise<{ id: string; email: string; name: string; provider: string }> {
    const response = await apiClient.get<{ id: string; email: string; name: string; provider: string }>('/auth/me');
    return response.data;
  },
};

// ==========================================
// INCOMES API
// ==========================================

export const incomesApi = createApiService<Income, CreateIncomeDto, UpdateIncomeDto, IncomeFilters>('incomes');

// Custom methods para Incomes (no CRUD genérico)
export const incomesApiCustom = {
  getMonthlySummary: async (year?: number, month?: number): Promise<MonthlySummary> => {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    const qs = params.toString() ? `?${params.toString()}` : '';
    
    const response = await customRequest<MonthlySummary, Record<string, unknown>>(
      'get',
      `/incomes/summary/monthly${qs}`
    );
    return response;
  },

  getYearlySummary: async (year?: number): Promise<YearlySummary> => {
    const params = year ? `?year=${year}` : '';
    
    const response = await customRequest<YearlySummary, Record<string, unknown>>(
      'get',
      `/incomes/summary/yearly${params}`
    );
    return response;
  },

  getOverallSummary: async (startDate?: string, endDate?: string): Promise<OverallSummary> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const response = await customRequest<OverallSummary, Record<string, unknown>>(
      'get',
      `/incomes/summary/overall${qs}`
    );
    return response;
  },
};

// Alias para compatibilidad hacia atrás
export const incomesService = {
  getAll: incomesApi.getAll,
  getAllPaginated: incomesApi.getAllPaginated,
  getById: incomesApi.getById,
  create: incomesApi.create,
  update: incomesApi.update,
  delete: incomesApi.delete,
  getMonthlySummary: incomesApiCustom.getMonthlySummary,
  getYearlySummary: incomesApiCustom.getYearlySummary,
  getOverallSummary: incomesApiCustom.getOverallSummary,
};

// ==========================================
// DEBTS API
// ==========================================

export const debtsApi = createApiService<Debt, CreateDebtDto, UpdateDebtDto, DebtFilters>('debts');

// Custom methods para Debts (no CRUD genérico)
export const debtsApiCustom = {
  registerPayment: async (debtId: string, amount: number, date?: string): Promise<Debt> => {
    const paymentDate = date || new Date().toISOString().split('T')[0];
    const response = await customRequest<Debt, Record<string, unknown>>(
      'post',
      `/debts/${debtId}/payments`,
      { amount, date: paymentDate }
    );
    return response;
  },

  getPayments: async (debtId: string): Promise<Payment[]> => {
    const response = await customRequest<Payment[], Record<string, unknown>>(
      'get',
      `/debts/${debtId}/payments`
    );
    return response;
  },

  getSummary: async (): Promise<DebtOverallSummary> => {
    const response = await customRequest<DebtOverallSummary, Record<string, unknown>>(
      'get',
      '/debts/summary/overall'
    );
    return response;
  },

  getMonthlySummary: async (year?: number, month?: number): Promise<DebtMonthlySummary> => {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    const qs = params.toString() ? `?${params.toString()}` : '';

    const response = await customRequest<DebtMonthlySummary, Record<string, unknown>>(
      'get',
      `/debts/summary/monthly${qs}`
    );
    return response;
  },

  getYearlySummary: async (year?: number): Promise<DebtYearlySummary> => {
    const params = year ? `?year=${year}` : '';

    const response = await customRequest<DebtYearlySummary, Record<string, unknown>>(
      'get',
      `/debts/summary/yearly${params}`
    );
    return response;
  },

  getOverallSummary: async (startDate?: string, endDate?: string): Promise<DebtOverallSummary> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const qsStr = params.toString();
    const qs = qsStr ? `?${qsStr}` : '';

    const response = await customRequest<DebtOverallSummary, Record<string, unknown>>(
      'get',
      `/debts/summary/overall${qs}`
    );
    return response;
  },
};

// Alias para compatibilidad hacia atrás
export const debtsService = {
  getAll: debtsApi.getAll,
  getAllPaginated: debtsApi.getAllPaginated,
  getById: debtsApi.getById,
  create: debtsApi.create,
  update: debtsApi.update,
  delete: debtsApi.delete,
  registerPayment: debtsApiCustom.registerPayment,
  getPayments: debtsApiCustom.getPayments,
  getSummary: debtsApiCustom.getSummary,
  getMonthlySummary: debtsApiCustom.getMonthlySummary,
  getYearlySummary: debtsApiCustom.getYearlySummary,
  getOverallSummary: debtsApiCustom.getOverallSummary,
};

// ==========================================
// EXPENSES API
// ==========================================

export const expensesApi = createApiService<Expense, CreateExpenseDto, UpdateExpenseDto, ExpenseFilters>('expenses');

// Custom methods para Expenses (no CRUD genérico)
export const expensesApiCustom = {
  getMonthlySummary: async (year?: number, month?: number): Promise<ExpenseMonthlySummary> => {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    const qs = params.toString() ? `?${params.toString()}` : '';

    const response = await customRequest<ExpenseMonthlySummary, Record<string, unknown>>(
      'get',
      `/expenses/summary/monthly${qs}`
    );
    return response;
  },

  getYearlySummary: async (year?: number): Promise<ExpenseYearlySummary> => {
    const params = year ? `?year=${year}` : '';

    const response = await customRequest<ExpenseYearlySummary, Record<string, unknown>>(
      'get',
      `/expenses/summary/yearly${params}`
    );
    return response;
  },

  getOverallSummary: async (startDate?: string, endDate?: string): Promise<ExpenseOverallSummary> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const response = await customRequest<ExpenseOverallSummary, Record<string, unknown>>(
      'get',
      `/expenses/summary/overall${qs}`
    );
    return response;
  },
};

// Alias para compatibilidad hacia atrás
export const expensesService = {
  getAll: expensesApi.getAll,
  getAllPaginated: expensesApi.getAllPaginated,
  getById: expensesApi.getById,
  create: expensesApi.create,
  update: expensesApi.update,
  delete: expensesApi.delete,
  getMonthlySummary: expensesApiCustom.getMonthlySummary,
  getYearlySummary: expensesApiCustom.getYearlySummary,
  getOverallSummary: expensesApiCustom.getOverallSummary,
};

// ==========================================
// LOANS API
// ==========================================

export const loansApi = createApiService<Loan, CreateLoanDto, UpdateLoanDto, LoanFilters>('loans');

// Custom methods para Loans (no CRUD genérico)
export const loansApiCustom = {
  registerPayment: async (loanId: string, amount: number): Promise<Loan> => {
    const response = await customRequest<Loan, Record<string, unknown>>(
      'post',
      `/loans/${loanId}/payments`,
      { amount, date: new Date().toISOString().split('T')[0] }
    );
    return response;
  },

  getOverallSummary: async (startDate?: string, endDate?: string): Promise<LoanOverallSummary> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const response = await customRequest<LoanOverallSummary, Record<string, unknown>>(
      'get',
      `/loans/summary/overall${qs}`
    );
    return response;
  },

  getLoanPerformance: async (loanId: string): Promise<LoanPerformance> => {
    const response = await customRequest<LoanPerformance, Record<string, unknown>>(
      'get',
      `/loans/${loanId}/performance`
    );
    return response;
  },

  getMonthlySummary: async (year?: number, month?: number): Promise<LoanMonthlySummary> => {
    const params = new URLSearchParams();
    if (year) params.append('year', String(year));
    if (month) params.append('month', String(month));
    const qs = params.toString() ? `?${params.toString()}` : '';

    const response = await customRequest<LoanMonthlySummary, Record<string, unknown>>(
      'get',
      `/loans/summary/monthly${qs}`
    );
    return response;
  },

  getYearlySummary: async (year?: number): Promise<LoanYearlySummary> => {
    const params = year ? `?year=${year}` : '';

    const response = await customRequest<LoanYearlySummary, Record<string, unknown>>(
      'get',
      `/loans/summary/yearly${params}`
    );
    return response;
  },

  getOverdueSummary: async (): Promise<Loan[]> => {
    const response = await customRequest<Loan[], Record<string, unknown>>(
      'get',
      '/loans/summary/overdue'
    );
    return response;
  },
};

// Alias para compatibilidad hacia atrás
export const loansService = {
  getAll: loansApi.getAll,
  getAllPaginated: loansApi.getAllPaginated,
  getById: loansApi.getById,
  create: loansApi.create,
  update: loansApi.update,
  delete: loansApi.delete,
  registerPayment: loansApiCustom.registerPayment,
  getOverallSummary: loansApiCustom.getOverallSummary,
  getLoanPerformance: loansApiCustom.getLoanPerformance,
  getMonthlySummary: loansApiCustom.getMonthlySummary,
  getYearlySummary: loansApiCustom.getYearlySummary,
  getOverdueSummary: loansApiCustom.getOverdueSummary,
};

// ==========================================
// POCKETS API
// ==========================================

export const pocketsApi = createApiService<Pocket, CreatePocketDto, UpdatePocketDto, Record<string, unknown>>('pockets');

export const pocketsApiCustom = {
  getSummary: async (): Promise<PocketsSummary> => {
    const response = await customRequest<PocketsSummary, Record<string, unknown>>(
      'get',
      '/pockets/summary'
    );
    return response;
  },

  transfer: async (data: TransferDto): Promise<void> => {
    return customRequest<void, TransferDto>('post', '/pockets/transfer', data);
  },

  deleteWithTransfer: async (
    pocketId: string,
    distributions: DistributionItem[],
    reason: string,
  ): Promise<{ deletedPocketId: string }> => {
    return customRequest<{ deletedPocketId: string }, DeleteWithTransferDto>(
      'post',
      `/pockets/${pocketId}/delete-with-transfer`,
      { distributions, reason },
    );
  },

  getHistory: async (pocketId: string, page: number, limit: number): Promise<PaginatedResult<Record<string, unknown>>> => {
    const response = await apiClient.get<
      ApiResponse<
        Record<string, unknown>[],
        { total: number; page: number; limit: number; totalPages: number }
      >
    >(`/pockets/${pocketId}/history?page=${page}&limit=${limit}`);
    return {
      data: response.data.data,
      meta: response.data.meta!,
    };
  },
};

export const pocketsService = {
  getAll: pocketsApi.getAll,
  getById: pocketsApi.getById,
  create: pocketsApi.create,
  update: pocketsApi.update,
  delete: pocketsApi.delete,
  getSummary: pocketsApiCustom.getSummary,
  transfer: pocketsApiCustom.transfer,
  getHistory: pocketsApiCustom.getHistory,
  deleteWithTransfer: pocketsApiCustom.deleteWithTransfer,
};

// ==========================================
// UTILITIES
// ==========================================

export { apiClient } from './client';
export { createApiService, customRequest } from './factory';
export type { PaginatedResult } from './factory';
