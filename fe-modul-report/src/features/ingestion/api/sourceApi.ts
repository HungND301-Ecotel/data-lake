/**
 * Client quản lý nguồn dữ liệu (M02).
 * Credential luôn là *tham chiếu* tới kho secret; API không nhận và không trả
 * về giá trị secret bao giờ.
 */
import { ingestionClient } from "./ingestionApi";

export type ConnectorType =
  | "PORTAL_UPLOAD"
  | "FILE_SERVER"
  | "POSTGRESQL"
  | "MYSQL"
  | "ORACLE"
  | "SQLSERVER"
  | "S3"
  | "REST_API";

export type SyncMode = "FULL" | "INCREMENTAL" | "CDC";
export type SourceStatus =
  | "DRAFT"
  | "TESTED"
  | "ACTIVE"
  | "PAUSED"
  | "QUARANTINED"
  | "RETIRED";

export interface ConnectorConfigRow {
  version: number;
  sync_mode: SyncMode;
  endpoint: string | null;
  schedule: string | null;
  watermark_field: string | null;
  watermark_value: string | null;
  active: boolean;
  change_note: string | null;
  created_by: string;
  created_at: string | null;
}

export interface SourceSchemaRow {
  object_name: string;
  version: number;
  columns: { name: string; data_type?: string; nullable?: boolean }[];
  mapping: Record<string, string>;
  current: boolean;
  discovered_at: string | null;
}

export interface SchemaDriftRow {
  object_name: string;
  kind: string;
  column_name: string | null;
  detail: string | null;
  breaking: boolean;
  detected_at: string | null;
  acknowledged_by: string | null;
}

export interface CredentialRow {
  version: number;
  reference: string;
  active: boolean;
  expires_at: string | null;
  rotated_at: string | null;
  rotated_by: string | null;
}

export interface DataSourceRow {
  id: string;
  code: string;
  name: string;
  connector_type: ConnectorType;
  status: SourceStatus;
  active: boolean;
  owner_user: string | null;
  description: string | null;
  network_route_approved: boolean;
  last_tested_at: string | null;
  last_test_result: string | null;
  paused_reason: string | null;
  quarantined_reason: string | null;
  sync_mode: SyncMode | null;
  config_version: number | null;
  credential_reference: string | null;
  credential_expires_at: string | null;
  warnings: string[];
  configs?: ConnectorConfigRow[];
  schemas?: SourceSchemaRow[];
  drifts?: SchemaDriftRow[];
  credentials?: CredentialRow[];
}

export interface SyncRunRow {
  id: string;
  sync_mode: SyncMode;
  status: string;
  watermark_from: string | null;
  watermark_to: string | null;
  rows_read: number;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
  triggered_by: string;
}

export const sourceApi = {
  list: async (): Promise<{ total: number; items: DataSourceRow[] }> =>
    (await ingestionClient.get("/api/v1/sources")).data,

  get: async (ref: string): Promise<DataSourceRow> =>
    (await ingestionClient.get(`/api/v1/sources/${ref}`)).data,

  create: async (payload: {
    code: string;
    name?: string;
    connector_type: ConnectorType;
    description?: string;
    owner_user?: string;
    owner_org_id?: string;
    network_route_approved?: boolean;
  }): Promise<DataSourceRow> =>
    (await ingestionClient.post("/api/v1/sources", payload)).data,

  setCredential: async (
    ref: string,
    payload: { reference: string; expires_at?: string }
  ): Promise<CredentialRow> =>
    (await ingestionClient.post(`/api/v1/sources/${ref}/credential`, payload)).data,

  configure: async (
    ref: string,
    payload: {
      endpoint?: string;
      options?: Record<string, unknown>;
      sync_mode?: SyncMode;
      schedule?: string;
      watermark_field?: string;
      change_note?: string;
    }
  ): Promise<ConnectorConfigRow> =>
    (await ingestionClient.post(`/api/v1/sources/${ref}/config`, payload)).data,

  test: async (ref: string): Promise<{ ok: boolean; detail: string }> =>
    (await ingestionClient.post(`/api/v1/sources/${ref}/test`)).data,

  activate: async (ref: string): Promise<DataSourceRow> =>
    (await ingestionClient.post(`/api/v1/sources/${ref}/activate`)).data,

  pause: async (ref: string, reason: string): Promise<DataSourceRow> =>
    (await ingestionClient.post(`/api/v1/sources/${ref}/pause`, { reason })).data,

  discover: async (
    ref: string,
    payload: {
      object_name: string;
      columns: { name: string; data_type?: string; nullable?: boolean }[];
      mapping?: Record<string, string>;
    }
  ): Promise<{ schema_version: number; drifts: SchemaDriftRow[]; breaking: boolean; status: string }> =>
    (await ingestionClient.post(`/api/v1/sources/${ref}/discover`, payload)).data,

  acknowledgeDrift: async (
    ref: string,
    note: string,
    resume: boolean
  ): Promise<{ acknowledged: number; status: string }> =>
    (await ingestionClient.post(`/api/v1/sources/${ref}/drift/acknowledge`, {
      note,
      resume,
    })).data,

  startSync: async (
    ref: string,
    payload: { watermark_to?: string; resnapshot?: boolean; reason?: string }
  ): Promise<SyncRunRow> =>
    (await ingestionClient.post(`/api/v1/sources/${ref}/sync-runs`, payload)).data,

  runs: async (ref: string): Promise<{ total: number; items: SyncRunRow[] }> =>
    (await ingestionClient.get(`/api/v1/sources/${ref}/sync-runs`)).data,
};

export default sourceApi;
