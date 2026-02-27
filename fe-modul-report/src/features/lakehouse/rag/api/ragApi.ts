import axiosDataLakeClient from "../../../../services/axiosDataLakeClient";
import type { RagIngestRequest, RagIngestResponse, RagChatRequest, RagChatResponse, RagSearchRequest, RagSearchResponse } from "../types/rag";

export const ragApi = {
  ingest: async (data: RagIngestRequest): Promise<RagIngestResponse> => {
    const res = await axiosDataLakeClient.post("/api/v1/lakehouse/rag/ingest", data);
    return res.data;
  },

  chat: async (data: RagChatRequest): Promise<RagChatResponse> => {
    const res = await axiosDataLakeClient.post("/api/v1/lakehouse/rag/chat", data);
    return res.data;
  },

  search: async (data: RagSearchRequest): Promise<RagSearchResponse> => {
    const res = await axiosDataLakeClient.post("/api/v1/lakehouse/rag/search", data);
    return res.data;
  },

  getChartUrl: (filename: string): string =>
    `${axiosDataLakeClient.defaults.baseURL}/api/v1/lakehouse/charts/${filename}`,
};
