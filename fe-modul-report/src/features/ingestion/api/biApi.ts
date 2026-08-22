/**
 * Client tích hợp BI/Tableau (M12).
 * View chỉ dựng được trên dataset gold_bi, và chỉ kích hoạt được khi đã có
 * ánh xạ row-level security.
 */
import { ingestionClient } from "./ingestionApi";

export type BiStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "REVOKED";
export type BiConnectionMode = "LIVE" | "EXTRACT";
export type RefreshStatus = "RUNNING" | "SUCCEEDED" | "FAILED";
export type PrincipalType = "USER" | "GROUP";

export interface BiRlsMapping {
  id: string;
  principal_type: PrincipalType;
  principal_ref: string;
  org_id: string | null;
  max_clearance: number;
  row_filter: Record<string, unknown> | null;
  active: boolean;
}

export interface BiView {
  id: string;
  code: string;
  name: string;
  dataset_code: string | null;
  dataset_status: string | null;
  rls_enabled: boolean;
  status: BiStatus;
  applied_at: string | null;
  apply_error: string | null;
  created_by: string;
  created_at: string | null;
  sql_definition?: string;
  rls_mappings?: BiRlsMapping[];
}

export interface BiRefreshRun {
  status: RefreshStatus;
  rows: number;
  kept_previous: boolean;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  triggered_by?: string;
}

export interface BiDataSource {
  id: string;
  code: string;
  name: string;
  view_code: string | null;
  connection_mode: BiConnectionMode;
  service_account_ref: string | null;
  workbook_ref: string | null;
  status: BiStatus;
  export_requires_approval: boolean;
  max_extract_rows: number;
  revoked_at: string | null;
  revoke_reason: string | null;
  owner_user: string;
  last_refresh: BiRefreshRun | null;
}

export interface BiExportRow {
  occurred_at: string;
  principal_ref: string;
  export_format: string | null;
  rows: number;
  result: string;
  denial_reason: string | null;
  approved_by: string | null;
  correlation_id: string | null;
}

export interface PersonaPreview {
  principal_ref: string;
  mapped: boolean;
  org_id?: string | null;
  max_clearance?: number;
  row_filter?: Record<string, unknown>;
  total: number;
  items: Record<string, unknown>[];
}

interface Listing<T> {
  total: number;
  items: T[];
}

export const biApi = {
  listViews: async (): Promise<Listing<BiView>> =>
    (await ingestionClient.get("/api/v1/bi/views")).data,

  getView: async (ref: string): Promise<BiView> =>
    (await ingestionClient.get(`/api/v1/bi/views/${ref}`)).data,

  createView: async (payload: {
    code: string;
    name?: string;
    dataset_code: string;
    rls_enabled?: boolean;
  }): Promise<BiView> => (await ingestionClient.post("/api/v1/bi/views", payload)).data,

  addMapping: async (
    ref: string,
    payload: {
      principal_type?: PrincipalType;
      principal_ref: string;
      org_id?: string;
      max_clearance?: number;
      row_filter?: Record<string, unknown>;
    }
  ): Promise<BiView> =>
    (await ingestionClient.post(`/api/v1/bi/views/${ref}/rls`, payload)).data,

  applyView: async (ref: string): Promise<BiView> =>
    (await ingestionClient.post(`/api/v1/bi/views/${ref}/apply`)).data,

  preview: async (ref: string, principalRef: string, limit = 50): Promise<PersonaPreview> =>
    (
      await ingestionClient.get(`/api/v1/bi/views/${ref}/preview`, {
        params: { principal_ref: principalRef, limit },
      })
    ).data,

  listDataSources: async (): Promise<Listing<BiDataSource>> =>
    (await ingestionClient.get("/api/v1/bi/data-sources")).data,

  createDataSource: async (payload: {
    code: string;
    name?: string;
    view_code: string;
    connection_mode?: BiConnectionMode;
    service_account_ref?: string;
    workbook_ref?: string;
    max_extract_rows?: number;
  }): Promise<BiDataSource> =>
    (await ingestionClient.post("/api/v1/bi/data-sources", payload)).data,

  refresh: async (ref: string): Promise<BiRefreshRun & { datasource: string }> =>
    (await ingestionClient.post(`/api/v1/bi/data-sources/${ref}/refresh`)).data,

  refreshHistory: async (ref: string): Promise<Listing<BiRefreshRun>> =>
    (await ingestionClient.get(`/api/v1/bi/data-sources/${ref}/refresh-history`)).data,

  exportData: async (
    ref: string,
    payload: { principal_ref?: string; format?: string; approved_by?: string }
  ): Promise<{ rows: number; approved_by: string | null }> =>
    (await ingestionClient.post(`/api/v1/bi/data-sources/${ref}/export`, payload)).data,

  exportHistory: async (ref: string): Promise<Listing<BiExportRow>> =>
    (await ingestionClient.get(`/api/v1/bi/data-sources/${ref}/exports`)).data,

  revoke: async (ref: string, reason: string): Promise<BiDataSource> =>
    (await ingestionClient.post(`/api/v1/bi/data-sources/${ref}/revoke`, { reason })).data,
};

export default biApi;
