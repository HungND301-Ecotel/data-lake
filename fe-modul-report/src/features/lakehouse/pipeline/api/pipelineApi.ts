import axiosDataLakeClient from "../../../../services/axiosDataLakeClient";
import type {
  PipelineUploadResponse,
  RawListResponse,
  RawFile,
  BronzeListResponse,
  BronzeRecord,
  SilverListResponse,
  SilverRecord,
  AsyncJobResponse,
} from "../../shared/types/lakehouse";

export const pipelineApi = {
  upload: async (file: File, asyncMode = false, onProgress?: (percent: number) => void): Promise<PipelineUploadResponse | AsyncJobResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosDataLakeClient.post("/api/v1/lakehouse/process/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      params: { async: asyncMode },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    return res.data;
  },

  // Raw layer
  listRaw: async (): Promise<RawListResponse> => {
    const res = await axiosDataLakeClient.get("/api/v1/lakehouse/raw");
    return res.data;
  },

  getRaw: async (fileId: string): Promise<RawFile> => {
    const res = await axiosDataLakeClient.get(`/api/v1/lakehouse/raw/${fileId}`);
    return res.data;
  },

  getPreviewUrl: (fileId: string): string =>
    `${axiosDataLakeClient.defaults.baseURL}/api/v1/lakehouse/raw/${fileId}/preview`,

  getDownloadUrl: (fileId: string): string =>
    `${axiosDataLakeClient.defaults.baseURL}/api/v1/lakehouse/raw/${fileId}/download`,

  // Bronze layer
  listBronze: async (): Promise<BronzeListResponse> => {
    const res = await axiosDataLakeClient.get("/api/v1/lakehouse/bronze");
    return res.data;
  },

  getBronze: async (fileId: string): Promise<BronzeRecord> => {
    const res = await axiosDataLakeClient.get(`/api/v1/lakehouse/bronze/${fileId}`);
    return res.data;
  },

  // Silver layer
  listSilver: async (): Promise<SilverListResponse> => {
    const res = await axiosDataLakeClient.get("/api/v1/lakehouse/silver");
    return res.data;
  },

  getSilver: async (fileId: string): Promise<SilverRecord> => {
    const res = await axiosDataLakeClient.get(`/api/v1/lakehouse/silver/${fileId}`);
    return res.data;
  },

  getSilverDownloadUrl: (fileId: string): string =>
    `${axiosDataLakeClient.defaults.baseURL}/api/v1/lakehouse/silver/${fileId}/download`,
};
