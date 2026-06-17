export interface ApiResponse<T, M = undefined> {
  statusCode: number;
  data: T;
  message: string;
  timestamp: string;
  meta?: M;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: string[];
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}