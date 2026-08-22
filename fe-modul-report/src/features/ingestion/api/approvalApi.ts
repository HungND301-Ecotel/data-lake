/**
 * Client phê duyệt & quản trị vòng đời (M07).
 * Quyết định luôn gắn với ảnh chụp bằng chứng: nếu tài nguyên đổi sau khi
 * duyệt, phê duyệt mất hiệu lực.
 */
import { ingestionClient } from "./ingestionApi";

export type ApprovalAction =
  | "DATASET_PUBLISH"
  | "LABEL_CHANGE"
  | "DATA_EXPORT"
  | "RETENTION_DESTROY"
  | "PUBLICATION_REVOKE";

export type ApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "STALE";

export interface ApprovalWorkflow {
  id: string;
  resource_type: string;
  action: ApprovalAction;
  required_approvals: number;
  approver_roles: string[];
  four_eyes: boolean;
  sla_hours: number;
  active: boolean;
}

export interface ApprovalStep {
  decision: "APPROVE" | "REJECT";
  approver: string;
  approver_roles: string | null;
  note: string | null;
  snapshot_checksum: string;
  decided_at: string | null;
}

export interface ApprovalRequest {
  id: string;
  resource_type: string;
  resource_id: string;
  resource_ref: string | null;
  action: ApprovalAction;
  reason: string;
  status: ApprovalStatus;
  required_approvals: number;
  approvals_done: number;
  four_eyes: boolean;
  approver_roles: string[];
  security_level: number;
  requested_by: string;
  snapshot_checksum: string;
  sla_due_at: string | null;
  escalated_at: string | null;
  decided_at: string | null;
  consumed_at: string | null;
  created_at: string | null;
  snapshot?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  steps?: ApprovalStep[];
}

export interface LegalHold {
  id: string;
  resource_type: string;
  resource_id: string;
  resource_ref: string | null;
  case_ref: string;
  reason: string;
  placed_by: string;
  placed_at: string | null;
  released_by: string | null;
  released_at: string | null;
  release_reason: string | null;
  active: boolean;
}

export interface RetentionSweep {
  execute: boolean;
  total: number;
  summary: Record<string, number>;
  items: {
    object_id: string;
    original_name: string;
    policy: string;
    due_at: string;
    outcome: string;
    detail?: string;
  }[];
}

export const approvalApi = {
  workflows: async (): Promise<{ total: number; items: ApprovalWorkflow[] }> =>
    (await ingestionClient.get("/api/v1/approval-workflows")).data,

  list: async (status?: ApprovalStatus): Promise<{ total: number; items: ApprovalRequest[] }> =>
    (await ingestionClient.get("/api/v1/approvals", { params: { status } })).data,

  get: async (id: string): Promise<ApprovalRequest> =>
    (await ingestionClient.get(`/api/v1/approvals/${id}`)).data,

  create: async (payload: {
    action: ApprovalAction;
    dataset_code: string;
    reason: string;
    security_label_id?: string;
  }): Promise<ApprovalRequest> =>
    (await ingestionClient.post("/api/v1/approvals", payload)).data,

  decide: async (id: string, approved: boolean, note?: string): Promise<ApprovalRequest> =>
    (await ingestionClient.post(`/api/v1/approvals/${id}/decide`, { approved, note }))
      .data,

  cancel: async (id: string, reason: string): Promise<ApprovalRequest> =>
    (await ingestionClient.post(`/api/v1/approvals/${id}/cancel`, { reason })).data,

  slaSweep: async (): Promise<{ escalated: number; items: unknown[] }> =>
    (await ingestionClient.post("/api/v1/approvals/sla-sweep")).data,

  holds: async (active?: boolean): Promise<{ total: number; items: LegalHold[] }> =>
    (await ingestionClient.get("/api/v1/legal-holds", { params: { active } })).data,

  placeHold: async (payload: {
    resource_type: string;
    resource_id: string;
    resource_ref?: string;
    case_ref: string;
    reason: string;
  }): Promise<LegalHold> =>
    (await ingestionClient.post("/api/v1/legal-holds", payload)).data,

  releaseHold: async (id: string, reason: string): Promise<LegalHold> =>
    (await ingestionClient.post(`/api/v1/legal-holds/${id}/release`, { reason })).data,

  retentionSweep: async (execute = false): Promise<RetentionSweep> =>
    (await ingestionClient.post("/api/v1/retention/sweep", { execute })).data,

  applyLabel: async (datasetCode: string): Promise<unknown> =>
    (await ingestionClient.post(`/api/v1/datasets/${datasetCode}/label`)).data,

  revoke: async (datasetCode: string): Promise<Record<string, number | string>> =>
    (await ingestionClient.post(`/api/v1/datasets/${datasetCode}/revoke`)).data,
};

export default approvalApi;
