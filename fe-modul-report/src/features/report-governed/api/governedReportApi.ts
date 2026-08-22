import axiosClient from "../../../services/axiosClient";

/**
 * Client cho module báo cáo có kiểm soát (M10).
 * Dùng axiosClient vì các endpoint này nằm ở backend portal, không phải worker.
 */

export interface ReportDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  ownerOrgCode: string | null;
  ownerUserId: string | null;
  securityLabelCode: string | null;
  securityLevel: number | null;
  templateFormat: string | null;
  periodType: string | null;
  active: boolean;
  createdBy: string;
  createdAt: string;
  versionCount: number;
  approvedVersionNo: number | null;
}

export interface ReportMapping {
  id: string;
  placeholderId: string;
  dataQueryId: string | null;
  dataQueryCode: string | null;
  dataQueryVersion: number | null;
  outputColumn: string | null;
  rowIndex: number | null;
  format: string | null;
  unit: string | null;
  aiInstruction: string | null;
  aiFactCodes: string | null;
}

export interface ReportPlaceholder {
  id: string;
  token: string;
  type: "FIELD" | "TABLE" | "CHART" | "AI_SECTION";
  name: string;
  locator: string | null;
  occurrences: number;
  mapping: ReportMapping | null;
}

export interface ReportTemplateVersion {
  id: string;
  definitionId: string;
  versionNo: number;
  fileKey: string;
  originalName: string | null;
  sha256: string | null;
  sizeBytes: number | null;
  status: "DRAFT" | "APPROVED" | "RETIRED";
  changeNote: string | null;
  createdBy: string;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  placeholders: ReportPlaceholder[];
}

export interface ReportDataQuery {
  id: string;
  code: string;
  versionNo: number;
  name: string;
  description: string | null;
  statement: string;
  outputColumns: string | null;
  securityLabelCode: string | null;
  securityLevel: number | null;
  maxRows: number | null;
  status: "DRAFT" | "APPROVED" | "RETIRED";
  createdBy: string;
  createdAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface ReportFact {
  code: string;
  placeholderName: string;
  label: string | null;
  factType: "SCALAR" | "TABLE";
  value: string | null;
  rawValue: string | null;
  unit: string | null;
  dataQueryCode: string | null;
  dataQueryVersion: number | null;
  sourceColumn: string | null;
  sourceRowIndex: number | null;
  sourceRowCount: number | null;
  executedAt: string;
}

export interface ReportNarrative {
  id: string;
  placeholderName: string;
  generatedText: string | null;
  finalText: string | null;
  factCodes: string | null;
  modelId: string | null;
  modelVersion: string | null;
  promptCode: string | null;
  blocked: boolean;
  warnings: string | null;
  editedBy: string | null;
  editedAt: string | null;
}

export type RunStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "EXPORTED";

export interface ReportRun {
  id: string;
  definitionId: string;
  definitionCode: string | null;
  templateVersionId: string;
  templateVersionNo: number | null;
  title: string | null;
  periodStart: string;
  periodEnd: string;
  status: RunStatus;
  snapshotId: string;
  snapshotChecksum: string | null;
  snapshotAt: string | null;
  securityLabelCode: string | null;
  securityLevel: number | null;
  aiModelId: string | null;
  aiModelVersion: string | null;
  aiPromptVersion: string | null;
  warnings: string[];
  createdBy: string;
  createdAt: string;
  submittedBy: string | null;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  decisionNote: string | null;
  artifactFileKey: string | null;
  exportedAt: string | null;
  facts: ReportFact[];
  narratives: ReportNarrative[];
}

export interface Validation {
  valid: boolean;
  unmappedPlaceholders: string[];
  problems: string[];
}

interface Listing<T> {
  total: number;
  items: T[];
}

export const governedReportApi = {
  // ---- Định nghĩa ------------------------------------------------------
  listDefinitions: async (): Promise<Listing<ReportDefinition>> =>
    (await axiosClient.get("/report-templates")).data,

  createDefinition: async (payload: Partial<ReportDefinition>): Promise<ReportDefinition> =>
    (await axiosClient.post("/report-templates", payload)).data,

  // ---- Phiên bản mẫu ---------------------------------------------------
  listVersions: async (code: string): Promise<Listing<ReportTemplateVersion>> =>
    (await axiosClient.get(`/report-templates/${code}/versions`)).data,

  uploadVersion: async (
    code: string,
    file: File,
    changeNote?: string
  ): Promise<ReportTemplateVersion> => {
    const form = new FormData();
    form.append("file", file);
    if (changeNote) form.append("changeNote", changeNote);
    return (
      await axiosClient.post(`/report-templates/${code}/versions`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    ).data;
  },

  getVersion: async (versionId: string): Promise<ReportTemplateVersion> =>
    (await axiosClient.get(`/report-templates/versions/${versionId}`)).data,

  validateVersion: async (versionId: string): Promise<Validation> =>
    (await axiosClient.get(`/report-templates/versions/${versionId}/validate`)).data,

  approveVersion: async (versionId: string): Promise<ReportTemplateVersion> =>
    (await axiosClient.post(`/report-templates/versions/${versionId}/approve`)).data,

  upsertMapping: async (payload: {
    placeholderId: string;
    dataQueryCode?: string;
    outputColumn?: string;
    rowIndex?: number;
    format?: string;
    unit?: string;
    aiInstruction?: string;
    aiFactCodes?: string[];
  }): Promise<ReportMapping> =>
    (await axiosClient.put("/report-templates/mappings", payload)).data,

  // ---- Truy vấn --------------------------------------------------------
  listDataQueries: async (): Promise<Listing<ReportDataQuery>> =>
    (await axiosClient.get("/report-templates/data-queries")).data,

  createDataQuery: async (payload: Partial<ReportDataQuery>): Promise<ReportDataQuery> =>
    (await axiosClient.post("/report-templates/data-queries", payload)).data,

  approveDataQuery: async (id: string): Promise<ReportDataQuery> =>
    (await axiosClient.post(`/report-templates/data-queries/${id}/approve`)).data,

  previewDataQuery: async (
    id: string,
    periodStart?: string,
    periodEnd?: string
  ): Promise<{ columns: string[]; rows: Record<string, unknown>[]; rowCount: number }> =>
    (
      await axiosClient.post(`/report-templates/data-queries/${id}/preview`, {
        periodStart,
        periodEnd,
      })
    ).data,

  // ---- Lần sinh --------------------------------------------------------
  listRuns: async (status?: string): Promise<Listing<ReportRun>> =>
    (await axiosClient.get("/report-runs", { params: { status } })).data,

  getRun: async (runId: string): Promise<ReportRun> =>
    (await axiosClient.get(`/report-runs/${runId}`)).data,

  createRun: async (payload: {
    definitionCode: string;
    title?: string;
    periodStart: string;
    periodEnd: string;
    skipNarrative?: boolean;
  }): Promise<ReportRun> => (await axiosClient.post("/report-runs", payload)).data,

  editNarrative: async (narrativeId: string, finalText: string): Promise<ReportNarrative> =>
    (await axiosClient.put(`/report-runs/narratives/${narrativeId}`, { finalText })).data,

  submit: async (runId: string): Promise<ReportRun> =>
    (await axiosClient.post(`/report-runs/${runId}/submit`)).data,

  decide: async (runId: string, decision: "APPROVE" | "REJECT", note?: string): Promise<ReportRun> =>
    (await axiosClient.post(`/report-runs/${runId}/decision`, { decision, note })).data,

  export: async (runId: string): Promise<ReportRun> =>
    (await axiosClient.post(`/report-runs/${runId}/export`)).data,

  /** Tải bản xem trước; trả về blob để mở trong tab mới. */
  preview: async (runId: string): Promise<Blob> =>
    (await axiosClient.get(`/report-runs/${runId}/preview`, { responseType: "blob" })).data,
};

export default governedReportApi;
