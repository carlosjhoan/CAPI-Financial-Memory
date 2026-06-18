// Base types for all features - reusable filters, pagination, and summaries
// Note: Some types (ApiResponse, PaginatedResponse) are already defined in api.types.ts
// This file adds feature-specific types

import type { ApiResponse } from './api.types';

// ==========================================
// FILTERS
// ==========================================

/**
 * Base filters available for all features
 */
export interface BaseFilters {
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
}

/**
 * Extended filters for specific features
 * Each feature can extend this with specific filters
 */
export interface DebtFilters extends BaseFilters {
  lender?: string;
  status?: 'pending' | 'paid' | 'overdue' | 'all';
  minAmount?: number;
  maxAmount?: number;
}

export interface ExpenseFilters extends BaseFilters {
  category?: string;
  isFixed?: boolean;
}

// ==========================================
// PAGINATION
// ==========================================

/**
 * Pagination metadata
 */
export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Note: PaginatedResponse is already in api.types.ts
// Using re-export for convenience
export type { ApiResponse };

// ==========================================
// SUMMARIES
// ==========================================

/**
 * Base summary for any feature
 */
export interface BaseSummary {
  totalAmount: number;
  count: number;
  averageAmount?: number;
}

/**
 * Monthly summary format
 */
export interface MonthlySummary {
  month: string;
  year: number;
  totalAmount: number;
  count: number;
  averageAmount: number;
}

/**
 * Yearly summary format
 */
export interface YearlySummary {
  year: number;
  totalAmount: number;
  count: number;
  averageAmount: number;
  monthlyBreakdown: Record<string, number>;
}

/**
 * Overall summary format
 */
export interface OverallSummary {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  firstDate?: string;
  lastDate?: string;
}

// ==========================================
// CONFIGURATION
// ==========================================

/**
 * Filter configuration for dynamic FilterPanel
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FilterConfig<T extends Record<string, any>> {
  key: keyof T;
  label: string;
  type: 'select' | 'date' | 'number' | 'range' | 'text';
  placeholder?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
}

/**
 * View type for summary displays
 */
export type ViewType = 'all' | 'monthly' | 'yearly' | 'dateRange';

/**
 * Pagination callback interface
 */
export interface PaginationConfig {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}