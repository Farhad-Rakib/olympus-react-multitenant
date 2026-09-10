export type ContentType = 'application/json' | 'multipart/form-data' | 'application/x-www-form-urlencoded';

export interface HttpRequestConfig {
  baseUrl?: string;
  contentType?: ContentType;
  // `unknown` rather than Record<string, unknown>: callers pass typed DTOs, and a TS interface has
  // no implicit index signature, so it is not assignable to a Record. Serialisation is axios's job.
  params?: unknown;
  headers?: Record<string, string>;
}

export interface PaginatedRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
