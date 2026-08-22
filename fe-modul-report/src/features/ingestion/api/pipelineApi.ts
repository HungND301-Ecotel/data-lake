/**
 * Client quản lý pipeline (M05).
 * Một lần chạy ghi lại checksum của DAG và digest của worker image, nên kết quả
 * luôn truy được về đúng đoạn code đã chạy ra nó.
 */
import { ingestionClient } from "./ingestionApi";

export type RunStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "SKIPPED";

export interface DagTask {
  name: string;
  handler?: string;
  depends_on?: string[];
}

export interface PipelineVersionRow {
  version: number;
  status: string;
  definition: { tasks: DagTask[] };
  definition_checksum: string;
  contract: Record<string, unknown>;
  worker_image: string | null;
  worker_image_digest: string | null;
  schedule: string | null;
  sla_minutes: number | null;
  backfill_quota_runs: number;
  published_by: string | null;
  published_at: string | null;
}

export interface PipelineRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  owner_user: string;
  status: string;
  published_version: number | null;
  sla_minutes: number | null;
  schedule: string | null;
  versions?: PipelineVersionRow[];
}

export interface TaskRunRow {
  task_name: string;
  depends_on: string[];
  status: RunStatus;
  attempt: number;
  max_attempts: number;
  lease_owner: string | null;
  output_committed: boolean;
  output_ref: string | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
}

export interface RunRow {
  id: string;
  pipeline_code: string;
  version: number;
  trigger: string;
  input_ref: string | null;
  idempotency_key: string;
  status: RunStatus;
  cancel_requested: boolean;
  cancel_reason: string | null;
  code_version: string;
  worker_image_digest: string | null;
  started_at: string | null;
  finished_at: string | null;
  sla_due_at: string | null;
  sla_breached: boolean;
  error: string | null;
  triggered_by: string;
  backfill_id: string | null;
  tasks?: TaskRunRow[];
  checkpoints?: { sequence: number; label: string; state: Record<string, unknown>; created_at: string | null }[];
}

export interface BackfillRow {
  id: string;
  pipeline_code: string;
  window_from: string;
  window_to: string;
  planned_runs: number;
  quota_runs: number;
  requires_approval: boolean;
  approval_request_id: string | null;
  status: string;
  reason: string;
  requested_by: string;
}

export const pipelineApi = {
  list: async (): Promise<{ total: number; items: PipelineRow[] }> =>
    (await ingestionClient.get("/api/v1/pipelines")).data,

  get: async (ref: string): Promise<PipelineRow> =>
    (await ingestionClient.get(`/api/v1/pipelines/${ref}`)).data,

  create: async (payload: {
    code: string;
    name?: string;
    description?: string;
    owner_user?: string;
  }): Promise<PipelineRow> =>
    (await ingestionClient.post("/api/v1/pipelines", payload)).data,

  addVersion: async (
    ref: string,
    payload: {
      definition: { tasks: DagTask[] };
      contract?: Record<string, unknown>;
      worker_image?: string;
      worker_image_digest?: string;
      schedule?: string;
      sla_minutes?: number;
      backfill_quota_runs?: number;
    }
  ): Promise<{ version: number; status: string; definition_checksum: string }> =>
    (await ingestionClient.post(`/api/v1/pipelines/${ref}/versions`, payload)).data,

  publishVersion: async (ref: string, version: number): Promise<PipelineRow> =>
    (await ingestionClient.post(`/api/v1/pipelines/${ref}/versions/${version}/publish`))
      .data,

  startRun: async (
    ref: string,
    payload: { trigger?: string; input_ref?: string }
  ): Promise<RunRow> =>
    (await ingestionClient.post(`/api/v1/pipelines/${ref}/runs`, payload)).data,

  runs: async (ref: string): Promise<{ total: number; items: RunRow[] }> =>
    (await ingestionClient.get(`/api/v1/pipelines/${ref}/runs`)).data,

  run: async (id: string): Promise<RunRow> =>
    (await ingestionClient.get(`/api/v1/runs/${id}`)).data,

  cancel: async (id: string, reason: string): Promise<RunRow> =>
    (await ingestionClient.post(`/api/v1/runs/${id}/cancel`, { reason })).data,

  reprocess: async (id: string, reason: string): Promise<RunRow> =>
    (await ingestionClient.post(`/api/v1/runs/${id}/reprocess`, { reason })).data,

  planBackfill: async (
    ref: string,
    payload: {
      inputs: string[];
      window_from?: string;
      window_to?: string;
      reason: string;
    }
  ): Promise<BackfillRow & { requires_approval: boolean }> =>
    (await ingestionClient.post(`/api/v1/pipelines/${ref}/backfills`, payload)).data,

  executeBackfill: async (id: string): Promise<{ backfill_id: string; runs: string[] }> =>
    (await ingestionClient.post(`/api/v1/backfills/${id}/execute`)).data,

  backfills: async (): Promise<{ total: number; items: BackfillRow[] }> =>
    (await ingestionClient.get("/api/v1/backfills")).data,

  slaSweep: async (): Promise<{ breached: number; items: unknown[] }> =>
    (await ingestionClient.post("/api/v1/runs/sla-sweep")).data,
};

export default pipelineApi;
