import axiosDataLakeClient from "../../../services/axiosDataLakeClient";
import type {
  ChatSendResponse,
  ChatSessionsResponse,
  ChatHistoryResponse,
  ChatContext,
} from "../types/chat";

export interface RagChatResponse {
  answer: string;
  sources?: { content: string; metadata?: Record<string, unknown> }[];
  chart?: { filename: string };
}

export const chatApi = {
  send: async (
    message: string,
    sessionId: string | null,
    context?: ChatContext
  ): Promise<ChatSendResponse> => {
    const res = await axiosDataLakeClient.post("/api/v1/chat/", {
      message,
      session_id: sessionId,
      mode: context?.mode,
      database: context?.database,
      server_id: context?.serverId,
    });
    return res.data;
  },

  sendRag: async (
    query: string,
    history: { role: string; content: string }[] = []
  ): Promise<RagChatResponse> => {
    const res = await axiosDataLakeClient.post("/api/v1/lakehouse/rag/chat", {
      query,
      history,
    });
    return res.data;
  },

  ragSearch: async (query: string, topK = 5) => {
    const res = await axiosDataLakeClient.post("/api/v1/lakehouse/rag/search", {
      query,
      top_k: topK,
    });
    return res.data;
  },

  ragIngest: async (fileIds: string[]) => {
    const res = await axiosDataLakeClient.post("/api/v1/lakehouse/rag/ingest", {
      file_ids: fileIds,
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
