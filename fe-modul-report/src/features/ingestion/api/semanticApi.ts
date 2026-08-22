/**
 * Client tầng ngữ nghĩa (công cụ SQL của mục 6.1).
 * Mô hình không viết truy vấn — nó chọn một chỉ tiêu đã được định nghĩa và
 * duyệt, rồi điền tham số lấy từ chính danh sách chỉ tiêu đó khai báo.
 */
import { ingestionClient } from "./ingestionApi";

export type Aggregation = "SUM" | "AVG" | "MIN" | "MAX" | "COUNT" | "COUNT_DISTINCT";
export type MetricStatus = "DRAFT" | "APPROVED" | "RETIRED";
export type FilterOperator = "eq" | "ne" | "lt" | "lte" | "gt" | "gte" | "in";

export interface SemanticMetric {
  id: string;
  code: string;
  name: string;
  description: string | null;
  synonyms: string | null;
  dataset_code: string | null;
  measure_field: string | null;
  aggregation: Aggregation;
  unit: string | null;
  dimensions: string[];
  filters: string[];
  status: MetricStatus;
  owner_user: string;
  security_level: number;
  max_rows_scanned: number;
  max_groups: number;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
}

export interface MetricResult {
  metric: string;
  name: string;
  aggregation: Aggregation;
  measure_field: string | null;
  unit: string | null;
  dimension: string | null;
  filters: { field: string; op: FilterOperator; value: unknown }[];
  dataset: string;
  dataset_version: string | null;
  rows_scanned: number;
  groups: number;
  /** Con số chỉ tính trên phần người gọi được đọc. */
  partial: boolean;
  partial_note: string | null;
  duration_ms: number;
  computed_at: string;
  checksum: string;
  items: { group: string | null; value: number; rows: number }[];
}

export interface MetricRunRow {
  executed_at: string;
  executed_by: string;
  dataset_version: string | null;
  parameters: Record<string, unknown>;
  rows_scanned: number;
  groups_returned: number;
  partial: boolean;
  duration_ms: number;
  result_checksum: string | null;
  correlation_id: string | null;
}

export const semanticApi = {
  list: async (status?: MetricStatus): Promise<{ total: number; items: SemanticMetric[] }> =>
    (await ingestionClient.get("/api/v1/metrics", { params: { status } })).data,

  define: async (payload: {
    code: string;
    name?: string;
    description?: string;
    synonyms?: string;
    dataset_code: string;
    measure_field?: string;
    aggregation?: Aggregation;
    unit?: string;
    dimensions?: string[];
    filters?: string[];
    max_rows_scanned?: number;
    max_groups?: number;
  }): Promise<SemanticMetric> =>
    (await ingestionClient.post("/api/v1/metrics", payload)).data,

  approve: async (ref: string): Promise<SemanticMetric> =>
    (await ingestionClient.post(`/api/v1/metrics/${ref}/approve`)).data,

  retire: async (ref: string, reason: string): Promise<SemanticMetric> =>
    (await ingestionClient.post(`/api/v1/metrics/${ref}/retire`, { reason })).data,

  run: async (
    ref: string,
    payload: {
      dimension?: string;
      filters?: { field: string; op: FilterOperator; value: unknown }[];
    }
  ): Promise<MetricResult> =>
    (await ingestionClient.post(`/api/v1/metrics/${ref}/run`, payload)).data,

  runs: async (ref: string): Promise<{ total: number; items: MetricRunRow[] }> =>
    (await ingestionClient.get(`/api/v1/metrics/${ref}/runs`)).data,
};

export default semanticApi;
