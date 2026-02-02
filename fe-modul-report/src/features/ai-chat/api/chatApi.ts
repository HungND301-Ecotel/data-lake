import axiosDataLakeClient from "../../../services/axiosDataLakeClient";
import type {
  ChatSendResponse,
  ChatSessionsResponse,
  ChatHistoryResponse,
} from "../types/chat";

export const chatApi = {
  send: async (
    message: string,
    sessionId: string | null
  ): Promise<ChatSendResponse> => {
    const res = await axiosDataLakeClient.post("/api/v1/chat/", {
      message,
      session_id: sessionId,
    });
    return res.data;
  },

  getSessions: async (): Promise<ChatSessionsResponse> => {
    const res = await axiosDataLakeClient.get("/api/v1/chat/sessions");
    return res.data;
  },

  getHistory: async (sessionId: string): Promise<ChatHistoryResponse> => {
    const res = await axiosDataLakeClient.get(
      `/api/v1/chat/history/${sessionId}`
    );
    return res.data;
  },

  clearHistory: async (sessionId: string): Promise<void> => {
    await axiosDataLakeClient.delete(`/api/v1/chat/history/${sessionId}`);
  },

  search: async (query: string, k: number = 5): Promise<unknown> => {
    const res = await axiosDataLakeClient.post("/api/v1/chat/search", {
      query,
      k,
    });
    return res.data;
  },
};

export const chartApi = {
  generate: async (
    data: unknown,
    chartType: string,
    options: Record<string, unknown> = {}
  ): Promise<unknown> => {
    const res = await axiosDataLakeClient.post("/api/v1/charts/generate", {
      data,
      chart_type: chartType,
      options,
    });
    return res.data;
  },

  suggest: async (data: unknown): Promise<unknown> => {
    const res = await axiosDataLakeClient.post("/api/v1/charts/suggest", {
      data,
    });
    return res.data;
  },
};
