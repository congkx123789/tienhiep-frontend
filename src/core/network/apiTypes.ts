export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  status?: string;
}

export interface PaginatedResponse<T = any> {
  items?: T[];
  books?: T[];
  sects?: T[];
  total: number;
  page: number;
  per_page: number;
}
