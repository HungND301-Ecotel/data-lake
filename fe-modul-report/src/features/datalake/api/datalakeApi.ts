import axiosDataLakeClient from "../../../services/axiosDataLakeClient";
import type {
  HealthStatus,
  ReadyStatus,
  DataStatus,
  DataSource,
} from "../types/datalake";
import type { AxiosProgressEvent } from "axios";

export const healthApi = {
  check: async (): Promise<HealthStatus> => {
    const res = await axiosDataLakeClient.get("/health");
    return res.data;
  },

  ready: async (): Promise<ReadyStatus> => {
    const res = await axiosDataLakeClient.get("/ready");
    return res.data;
  },
};

export const dataApi = {
  getStatus: async (): Promise<DataStatus> => {
    const res = await axiosDataLakeClient.get("/api/v1/data/status");
    return res.data;
  },

  getSources: async (): Promise<DataSource[]> => {
    const res = await axiosDataLakeClient.get("/api/v1/data/sources");
    return res.data;
  },

  load: async (): Promise<unknown> => {
    const res = await axiosDataLakeClient.post("/api/v1/data/load");
    return res.data;
  },

  reindex: async (): Promise<unknown> => {
    const res = await axiosDataLakeClient.post("/api/v1/data/reindex");
    return res.data;
  },

  uploadExcel: async (
    file: File,
    onProgress?: (event: AxiosProgressEvent) => void
  ): Promise<unknown> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosDataLakeClient.post(
      "/api/v1/data/upload",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: onProgress,
      }
    );
    return res.data;
  },

  uploadBak: async (
    file: File,
    rowLimit?: number,
    includeSchema: boolean = true,
    onProgress?: (event: AxiosProgressEvent) => void
  ): Promise<unknown> => {
    const formData = new FormData();
    formData.append("file", file);
    if (rowLimit) formData.append("row_limit", rowLimit.toString());
    formData.append("include_schema", includeSchema.toString());
    const res = await axiosDataLakeClient.post(
      "/api/v1/data/upload-bak",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: onProgress,
        timeout: 30000000000,
      }
    );
    return res.data;
  },

  importLive: async (
    database: string,
    tables: string[] | null = null,
    rowLimit?: number,
    includeSchema: boolean = true
  ): Promise<unknown> => {
    const payload: Record<string, unknown> = {
      database,
      tables,
      include_schema: includeSchema,
    };
    if (rowLimit !== undefined) {
      payload.row_limit = rowLimit;
    }
    const res = await axiosDataLakeClient.post("/api/v1/data/import-live", payload);
    return res.data;
  },
};
