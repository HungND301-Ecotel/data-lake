export interface GetRequest {
  table: string;
  filters?: Record<string, any>;
  columns?: string[];
  order_by?: string[];
  limit?: number;
  offset?: number;
}
export interface GetResponse {
  total?: number;
  rows?: Array<Record<string, any>>;
}
