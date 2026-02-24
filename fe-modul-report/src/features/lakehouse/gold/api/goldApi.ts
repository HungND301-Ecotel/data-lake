import axiosDataLakeClient from "../../../../services/axiosDataLakeClient";
import type { GoldExtractRequest, GoldRecord, GoldListResponse, GoldPrompt, GoldPromptCreateRequest } from "../types/gold";

export const goldApi = {
  extract: async (data: GoldExtractRequest): Promise<GoldRecord> => {
    const res = await axiosDataLakeClient.post("/api/v1/lakehouse/gold/extract", data);
    return res.data;
  },

  confirm: async (goldId: string): Promise<{ message: string; gold_id: string; confirmed: boolean }> => {
    const res = await axiosDataLakeClient.post(`/api/v1/lakehouse/gold/confirm/${goldId}`);
    return res.data;
  },

  list: async (): Promise<GoldListResponse> => {
    const res = await axiosDataLakeClient.get("/api/v1/lakehouse/gold/");
    return res.data;
  },

  get: async (goldId: string): Promise<GoldRecord> => {
    const res = await axiosDataLakeClient.get(`/api/v1/lakehouse/gold/${goldId}`);
    return res.data;
  },

  getDownloadUrl: (goldId: string): string =>
    `${axiosDataLakeClient.defaults.baseURL}/api/v1/lakehouse/gold/${goldId}/download`,

  listPrompts: async (): Promise<GoldPrompt[]> => {
    const res = await axiosDataLakeClient.get("/api/v1/lakehouse/gold/prompts");
    return res.data;
  },

  savePrompt: async (data: GoldPromptCreateRequest): Promise<{ message: string; prompt_id: string }> => {
    const res = await axiosDataLakeClient.post("/api/v1/lakehouse/gold/prompts", data);
    return res.data;
  },
};
