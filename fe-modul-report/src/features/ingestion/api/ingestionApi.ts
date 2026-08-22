import axios from "axios";
import { message } from "antd";
import type {
  Artifact,
  AuditEvent,
  BronzeObject,
  DataSource,
  DlqItem,
  IngestMetadata,
  Organization,
  Page,
  ProcessingJob,
  RetentionPolicy,
  SecurityLabel,
  UploadSession,
  WorkerError,
} from "../types/ingestion";

/**
 * Client for the governed ingestion API. It is separate from
 * axiosDataLakeClient because the worker uses the doc 8.2 error envelope
 * ({ error: { code, message, ... } }) rather than FastAPI's { detail }.
 */
export const ingestionClient = axios.create({
  baseURL: import.meta.env.VITE_INGESTION_API || import.meta.env.VITE_DATALAKE_API,
  timeout: 600000,
});

/** Attach the portal token, plus DEV identity headers when there is none. */
ingestionClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (import.meta.env.VITE_INGESTION_DEV_USER) {
    config.headers["X-User-Id"] = import.meta.env.VITE_INGESTION_DEV_USER;
    config.headers["X-Roles"] = import.meta.env.VITE_INGESTION_DEV_ROLES || "DATA_STEWARD";
    config.headers["X-Clearance"] = import.meta.env.VITE_INGESTION_DEV_CLEARANCE || "2";
  }
  return config;
});

export class IngestionError extends Error {
  code: string;
  details: Record<string, unknown>;
  retryable: boolean;
  correlationId: string | null;
  status: number;

  constructor(status: number, payload: WorkerError) {
    super(payload.message);
    this.status = status;
    this.code = payload.code;
    this.details = payload.details || {};
    this.retryable = payload.retryable;
    this.correlationId = payload.correlation_id;
  }
}

ingestionClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const envelope = error.response?.data?.error as WorkerError | undefined;
    if (envelope) {
      const wrapped = new IngestionError(error.response.status, envelope);
      message.error(describe(wrapped));
      return Promise.reject(wrapped);
    }
    message.error(error.message || "Lỗi kết nối worker");
    return Promise.reject(error);
  }
);

/** Turn a worker error code into something a Vietnamese user can act on. */
export function describe(error: IngestionError): string {
  switch (error.code) {
    case "CLASSIFICATION_REQUIRED":
      return "Thiếu nhãn bảo mật hoặc metadata bắt buộc";
    case "POLICY_DENIED":
      return `Không đủ quyền: ${error.message}`;
    case "OBJECT_QUARANTINED":
      return "Đối tượng đang bị cách ly hoặc đã bị từ chối";
    case "CONFLICT":
      return error.message;
    case "RATE_LIMITED":
      return "Vượt hạn mức, thử lại sau";
    default:
      return error.message;
  }
}

export interface CreateUploadPayload extends IngestMetadata {
  original_name: string;
  size_bytes?: number;
  sha256?: string;
  mime_type?: string;
  total_parts?: number;
}

export const ingestionApi = {
  // ---- reference data -------------------------------------------------
  listSecurityLabels: async (): Promise<Page<SecurityLabel>> =>
    (await ingestionClient.get("/api/v1/security-labels")).data,

  listRetentionPolicies: async (): Promise<Page<RetentionPolicy>> =>
    (await ingestionClient.get("/api/v1/retention-policies")).data,

  listOrganizations: async (): Promise<Page<Organization>> =>
    (await ingestionClient.get("/api/v1/organizations")).data,

  listDataSources: async (): Promise<Page<DataSource>> =>
    (await ingestionClient.get("/api/v1/data-sources")).data,

  // ---- upload ----------------------------------------------------------
  createUpload: async (payload: CreateUploadPayload): Promise<UploadSession> =>
    (await ingestionClient.post("/api/v1/uploads", payload)).data,

  uploadPart: async (
    uploadId: string,
    partNumber: number,
    blob: Blob,
    onProgress?: (loaded: number) => void
  ): Promise<void> => {
    const form = new FormData();
    form.append("file", blob, `part-${partNumber}`);
    await ingestionClient.put(`/api/v1/uploads/${uploadId}/parts/${partNumber}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event) => onProgress?.(event.loaded),
    });
  },

  completeUpload: async (uploadId: string): Promise<BronzeObject> =>
    (await ingestionClient.post(`/api/v1/uploads/${uploadId}/complete`)).data,

  getUpload: async (uploadId: string): Promise<UploadSession> =>
    (await ingestionClient.get(`/api/v1/uploads/${uploadId}`)).data,

  abortUpload: async (uploadId: string): Promise<void> => {
    await ingestionClient.delete(`/api/v1/uploads/${uploadId}`);
  },

  // ---- objects ---------------------------------------------------------
  listObjects: async (params: {
    status?: string;
    document_type?: string;
    sha256?: string;
    q?: string;
    page?: number;
    size?: number;
  }): Promise<Page<BronzeObject>> =>
    (await ingestionClient.get("/api/v1/objects", { params })).data,

  getObject: async (objectId: string): Promise<BronzeObject> =>
    (await ingestionClient.get(`/api/v1/objects/${objectId}`)).data,

  processObject: async (
    objectId: string,
    jobType?: "BRONZE_EXTRACT" | "SILVER_STRUCTURE"
  ): Promise<ProcessingJob> =>
    (await ingestionClient.post(`/api/v1/objects/${objectId}/process`, { job_type: jobType })).data,

  getArtifactContent: async (
    artifactId: string
  ): Promise<Artifact & { content: string }> =>
    (await ingestionClient.get(`/api/v1/artifacts/${artifactId}/content`)).data,

  /** Downloads through the audited endpoint rather than a raw storage URL. */
  downloadObject: async (objectId: string, filename: string): Promise<void> => {
    const response = await ingestionClient.get(`/api/v1/objects/${objectId}/download`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data as Blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  },

  // ---- jobs ------------------------------------------------------------
  listJobs: async (params: {
    status?: string;
    object_id?: string;
    page?: number;
    size?: number;
  }): Promise<Page<ProcessingJob>> =>
    (await ingestionClient.get("/api/v1/jobs", { params })).data,

  cancelJob: async (jobId: string): Promise<ProcessingJob> =>
    (await ingestionClient.post(`/api/v1/jobs/${jobId}/cancel`)).data,

  listDlq: async (): Promise<Page<DlqItem>> =>
    (await ingestionClient.get("/api/v1/dlq")).data,

  replayDlq: async (dlqId: string): Promise<ProcessingJob> =>
    (await ingestionClient.post(`/api/v1/dlq/${dlqId}/replay`)).data,

  // ---- audit -----------------------------------------------------------
  searchAudit: async (params: {
    actor?: string;
    action?: string;
    resource_type?: string;
    resource_id?: string;
    result?: string;
    correlation_id?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }): Promise<Page<AuditEvent>> =>
    (await ingestionClient.get("/api/v1/audit", { params })).data,
};

export default ingestionApi;
