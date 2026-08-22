/**
 * Types for the governed ingestion API (M03) of ai_worker_lake_house.
 * Mirrors app/api/serializers.py on the worker side.
 */

export type ObjectStatus =
  | "UPLOADING"
  | "UPLOADED"
  | "QUARANTINED"
  | "ACCEPTED"
  | "PROCESSING"
  | "PROCESSED"
  | "REJECTED"
  | "ARCHIVED";

export type JobStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "CANCELLED"
  | "DEAD";

export type DuplicatePolicy = "REJECT" | "LINK_EXISTING" | "NEW_VERSION";

export interface SecurityLabel {
  id: string;
  code: string;
  name: string;
  /** A = public/internal, B = restricted, C = state secret (doc 9.1) */
  domain: "A" | "B" | "C";
  level: number;
  allow_external_ai: boolean;
  description?: string | null;
}

export interface RetentionPolicy {
  id: string;
  code: string;
  name: string;
  retention_days: number | null;
}

export interface Organization {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  active: boolean;
}

export interface DataSource {
  id: string;
  code: string;
  name: string;
  source_type: string;
  owner_org_id: string | null;
  active: boolean;
}

/** Metadata the worker requires before an object may enter the lake. */
export interface IngestMetadata {
  source_system_id: string;
  owner_org_id: string;
  security_label_id: string;
  retention_policy_id: string;
  document_type: string;
  purpose: string;
  duplicate_policy?: DuplicatePolicy;
}

export interface UploadSession {
  upload_id: string;
  status: "OPEN" | "COMPLETED" | "ABORTED" | "EXPIRED";
  original_name: string;
  declared_size_bytes: number | null;
  declared_sha256: string | null;
  total_parts: number | null;
  document_type: string;
  purpose: string;
  duplicate_policy: DuplicatePolicy;
  object_id: string | null;
  created_at: string;
  expires_at: string | null;
  completed_at: string | null;
  received_parts?: number[];
}

export interface ObjectVersion {
  version_id: string;
  version_no: number;
  sha256: string;
  size_bytes: number;
  mime_detected: string;
  created_by: string;
  created_at: string;
}

export interface Artifact {
  artifact_id: string;
  layer: "BRONZE" | "SILVER" | "GOLD";
  kind: string;
  sha256: string;
  size_bytes: number;
  producer: string | null;
  job_id: string | null;
  input_version_id: string;
  created_at: string;
  content_url: string;
}

export interface MalwareScan {
  scan_id: string;
  scanner: string;
  scanner_version: string | null;
  verdict: "PENDING" | "CLEAN" | "INFECTED" | "UNKNOWN" | "SKIPPED";
  signature: string | null;
  scanned_at: string;
}

export interface BronzeObject {
  object_id: string;
  original_name: string;
  sha256: string;
  mime_detected: string;
  size_bytes: number;
  status: ObjectStatus;
  status_reason: string | null;
  document_type: string;
  purpose: string;
  legal_hold: boolean;
  current_version_no: number;
  duplicate_of_object_id: string | null;
  source_system_id: string;
  owner_org_id: string;
  security_label_id: string;
  retention_policy_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  download_url: string;
  versions?: ObjectVersion[];
  artifacts?: Artifact[];
  scans?: MalwareScan[];
}

export interface ProcessingJob {
  job_id: string;
  job_type: "BRONZE_EXTRACT" | "SILVER_STRUCTURE";
  object_id: string;
  input_version_id: string;
  status: JobStatus;
  attempt: number;
  max_attempts: number;
  lease_owner: string | null;
  scheduled_at: string;
  started_at: string | null;
  finished_at: string | null;
  error_code: string | null;
  error_message: string | null;
  correlation_id: string | null;
  created_at: string;
}

export interface DlqItem {
  dlq_id: string;
  job_id: string;
  object_id: string;
  reason: string;
  replayed_at: string | null;
  created_at: string;
}

export interface AuditEvent {
  audit_id: string;
  occurred_at: string;
  actor: string;
  actor_org_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  result: "SUCCESS" | "DENIED" | "FAILURE";
  policy_decision: string | null;
  security_label_id: string | null;
  source_ip: string | null;
  correlation_id: string | null;
  details: string | null;
}

export interface Page<T> {
  total: number;
  page?: number;
  size?: number;
  items: T[];
}

/** Error envelope defined in doc 8.2. */
export interface WorkerError {
  code: string;
  message: string;
  details: Record<string, unknown>;
  retryable: boolean;
  timestamp: string;
  correlation_id: string | null;
}
