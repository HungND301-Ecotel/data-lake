/**
 * Client quản trị Dynamic API (M11).
 * Chỉ phục vụ mặt thiết kế; endpoint dữ liệu là dành cho client máy-máy.
 */
import { ingestionClient } from "./ingestionApi";

export type ApiStatus = "DRAFT" | "REVIEW" | "PUBLISHED" | "DEPRECATED" | "REVOKED";
export type MaskStrategy = "NONE" | "HIDDEN" | "PARTIAL" | "HASH";

export interface ApiFieldExposure {
  field_name: string;
  data_type: string;
  exposed: boolean;
  mask_strategy: MaskStrategy;
  filterable: boolean;
  sortable: boolean;
}

export interface ApiVersion {
  id: string;
  version: string;
  status: ApiStatus;
  dataset_version: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  published_by: string | null;
  published_at: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
  fields: ApiFieldExposure[];
}

export interface ApiProduct {
  id: string;
  code: string;
  name: string;
  description: string | null;
  dataset_code: string | null;
  dataset_status: string | null;
  owner_user: string;
  security_level: number;
  status: ApiStatus;
  current_version: string | null;
  default_page_size: number;
  max_page_size: number;
  created_by: string;
  created_at: string | null;
  versions?: ApiVersion[];
}

export interface ApiUsageRow {
  occurred_at: string;
  client_id: string | null;
  endpoint: string | null;
  api_version: string | null;
  status_code: number;
  result: string;
  rows_returned: number;
  duration_ms: number | null;
  denial_reason: string | null;
  correlation_id: string | null;
}

interface Listing<T> {
  total: number;
  items: T[];
}

export const dynamicApi = {
  listProducts: async (): Promise<Listing<ApiProduct>> =>
    (await ingestionClient.get("/api/v1/api-products")).data,

  getProduct: async (ref: string): Promise<ApiProduct> =>
    (await ingestionClient.get(`/api/v1/api-products/${ref}`)).data,

  createProduct: async (payload: {
    code: string;
    name?: string;
    description?: string;
    dataset_code: string;
    default_page_size?: number;
    max_page_size?: number;
  }): Promise<ApiProduct> =>
    (await ingestionClient.post("/api/v1/api-products", payload)).data,

  createVersion: async (
    ref: string,
    fields: Partial<ApiFieldExposure>[],
    breaking = false
  ): Promise<ApiProduct> =>
    (
      await ingestionClient.post(`/api/v1/api-products/${ref}/versions`, {
        fields,
        breaking,
      })
    ).data,

  submit: async (ref: string, version: string): Promise<ApiProduct> =>
    (await ingestionClient.post(`/api/v1/api-products/${ref}/versions/${version}/submit`))
      .data,

  review: async (
    ref: string,
    version: string,
    approved: boolean,
    note?: string
  ): Promise<ApiProduct> =>
    (
      await ingestionClient.post(
        `/api/v1/api-products/${ref}/versions/${version}/review`,
        { approved, note }
      )
    ).data,

  publish: async (ref: string, version: string): Promise<ApiProduct> =>
    (await ingestionClient.post(`/api/v1/api-products/${ref}/versions/${version}/publish`))
      .data,

  openapi: async (ref: string, version: string): Promise<Record<string, unknown>> =>
    (await ingestionClient.get(`/api/v1/api-products/${ref}/versions/${version}/openapi`))
      .data,

  revoke: async (ref: string, reason: string): Promise<ApiProduct> =>
    (await ingestionClient.post(`/api/v1/api-products/${ref}/revoke`, { reason })).data,

  materialize: async (ref: string): Promise<{ rows: number; skipped_objects: number }> =>
    (await ingestionClient.post(`/api/v1/api-products/${ref}/materialize`)).data,

  createClient: async (payload: {
    client_id: string;
    name?: string;
    contact?: string;
    owner_org_id?: string;
    clearance_level?: number;
    require_mtls?: boolean;
  }): Promise<{ client_id: string; client_secret: string; clearance_level: number }> =>
    (await ingestionClient.post("/api/v1/api-clients", payload)).data,

  subscribe: async (
    ref: string,
    payload: {
      client_id: string;
      scopes?: string;
      rate_limit_per_minute?: number;
      quota_per_day?: number;
    }
  ): Promise<unknown> =>
    (await ingestionClient.post(`/api/v1/api-products/${ref}/subscriptions`, payload))
      .data,

  usage: async (ref: string, size = 100): Promise<Listing<ApiUsageRow>> =>
    (await ingestionClient.get(`/api/v1/api-products/${ref}/usage`, { params: { size } }))
      .data,
};

export default dynamicApi;
