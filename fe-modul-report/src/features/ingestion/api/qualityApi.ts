/**
 * Client chất lượng dữ liệu (M06).
 * Rule mới luôn ở DRAFT: chỉ ngưỡng đã được duyệt mới tính vào cổng công bố.
 */
import { ingestionClient } from "./ingestionApi";

export type QualityDimension =
  | "COMPLETENESS"
  | "UNIQUENESS"
  | "VALIDITY"
  | "CONSISTENCY"
  | "FRESHNESS"
  | "REFERENTIAL_INTEGRITY";

export type QualityRuleType =
  | "NOT_NULL"
  | "UNIQUE"
  | "RANGE"
  | "ENUM"
  | "REGEX"
  | "COMPARE"
  | "FRESHNESS"
  | "REFERENCE";

export type QualitySeverity = "CRITICAL" | "MAJOR" | "MINOR";
export type QualityRuleStatus = "DRAFT" | "APPROVED" | "RETIRED";
export type QualityResultStatus = "PASS" | "FAIL" | "UNKNOWN";
export type QualityIssueStatus = "OPEN" | "WAIVED" | "RESOLVED";

export interface QualityRule {
  id: string;
  code: string;
  name: string;
  dimension: QualityDimension;
  rule_type: QualityRuleType;
  severity: QualitySeverity;
  status: QualityRuleStatus;
  field_name: string | null;
  config: Record<string, unknown>;
  threshold: number;
  suggested: boolean;
  created_by: string;
  approved_by: string | null;
  approved_at: string | null;
  active_waiver: {
    approved_by: string;
    reason: string;
    expires_at: string;
  } | null;
}

export interface QualityResult {
  rule_code: string;
  dimension: QualityDimension;
  severity: QualitySeverity;
  status: QualityResultStatus;
  evaluated_rows: number;
  violating_rows: number;
  observed_ratio: number | null;
  threshold: number;
  low_confidence: boolean;
  evidence: Record<string, unknown>[];
  error: string | null;
  waived: boolean;
}

export interface QualityRun {
  id: string;
  status: string;
  score: number | null;
  passed: number;
  failed: number;
  unknown: number;
  critical_failed: number;
  row_count: number;
  low_confidence: boolean;
  started_at: string | null;
  finished_at: string | null;
  triggered_by: string;
  results?: QualityResult[];
  /** Điểm tính lại từ evidence — phải trùng `score`. */
  score_recomputed?: number;
}

export interface QualityIssue {
  id: string;
  dataset_id: string;
  rule_code: string;
  severity: QualitySeverity;
  status: QualityIssueStatus;
  owner_user: string | null;
  detail: string | null;
  occurrences: number;
  last_seen_at: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface QualityGate {
  allowed: boolean;
  reason?: string;
  message?: string;
  score?: number | null;
  blocking?: { rule: string; status: string; observed_ratio: number | null; threshold: number }[];
  waived?: { rule: string; expires_at: string; approved_by: string }[];
  low_confidence?: boolean;
}

export interface DatasetQuality {
  dataset: string;
  namespace: string;
  rules: QualityRule[];
  latest_run: QualityRun | null;
  gate: QualityGate;
  open_issues: QualityIssue[];
}

export interface ProfileColumn {
  name: string;
  data_type: string;
  count: number;
  null_count: number;
  null_ratio: number | null;
  distinct_count: number;
  sample: string[];
  min?: number;
  max?: number;
  mean?: number;
}

export interface SuggestedRule {
  code: string;
  name: string;
  rule_type: QualityRuleType;
  field_name: string;
  severity: QualitySeverity;
  threshold: number;
  config: Record<string, unknown>;
  rationale: string;
}

export interface DatasetProfile {
  dataset: string;
  profiled_at: string;
  row_count: number;
  low_confidence: boolean;
  columns: ProfileColumn[];
  suggested_rules?: SuggestedRule[];
}

export interface TrendPoint {
  run_id: string;
  started_at: string | null;
  score: number | null;
  passed: number;
  failed: number;
  unknown: number;
  critical_failed: number;
  row_count: number;
  low_confidence: boolean;
}

interface Listing<T> {
  total: number;
  items: T[];
}

export const qualityApi = {
  datasetQuality: async (ref: string): Promise<DatasetQuality> =>
    (await ingestionClient.get(`/api/v1/datasets/${ref}/quality`)).data,

  trend: async (ref: string, limit = 30): Promise<{ dataset: string; points: TrendPoint[] }> =>
    (await ingestionClient.get(`/api/v1/datasets/${ref}/quality/trend`, {
      params: { limit },
    })).data,

  profile: async (ref: string): Promise<DatasetProfile> =>
    (await ingestionClient.post(`/api/v1/datasets/${ref}/profile`)).data,

  listRules: async (dataset?: string): Promise<Listing<QualityRule>> =>
    (await ingestionClient.get("/api/v1/quality/rules", { params: { dataset } })).data,

  createRule: async (payload: {
    code: string;
    name?: string;
    dataset_code: string;
    rule_type: QualityRuleType;
    severity?: QualitySeverity;
    field_name?: string;
    threshold?: number;
    config?: Record<string, unknown>;
    suggested?: boolean;
  }): Promise<QualityRule> =>
    (await ingestionClient.post("/api/v1/quality/rules", payload)).data,

  approveRule: async (ref: string): Promise<QualityRule> =>
    (await ingestionClient.post(`/api/v1/quality/rules/${ref}/approve`)).data,

  retireRule: async (ref: string, reason: string): Promise<QualityRule> =>
    (await ingestionClient.post(`/api/v1/quality/rules/${ref}/retire`, { reason })).data,

  createWaiver: async (
    ref: string,
    payload: { reason: string; approved_by: string; expires_at: string }
  ): Promise<unknown> =>
    (await ingestionClient.post(`/api/v1/quality/rules/${ref}/waivers`, payload)).data,

  run: async (datasetCode: string): Promise<QualityRun> =>
    (await ingestionClient.post("/api/v1/quality-runs", { dataset_code: datasetCode }))
      .data,

  getRun: async (runId: string): Promise<QualityRun> =>
    (await ingestionClient.get(`/api/v1/quality-runs/${runId}`)).data,

  listIssues: async (dataset?: string, status?: string): Promise<Listing<QualityIssue>> =>
    (await ingestionClient.get("/api/v1/quality/issues", { params: { dataset, status } }))
      .data,

  resolveIssue: async (issueId: string, note: string): Promise<QualityIssue> =>
    (await ingestionClient.post(`/api/v1/quality/issues/${issueId}/resolve`, { note }))
      .data,
};

export default qualityApi;
