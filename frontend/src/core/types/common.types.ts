export type Theme = 'light' | 'dark' | 'dim';

export interface Option {
  value: string;
  label: string;
}

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}