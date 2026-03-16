import axiosDataLakeClient from "../../../../services/axiosDataLakeClient";
import type { DocumentChatResponse } from "../types/documentChat";

export const documentChatApi = {
  chat: async (query: string, options?: { sessionId?: string; file?: File }): Promise<DocumentChatResponse> => {
    const formData = new FormData();
    formData.append("query", query);
    if (options?.sessionId) formData.append("session_id", options.sessionId);
    if (options?.file) formData.append("file", options.file);
    const res = await axiosDataLakeClient.post("/api/v1/lakehouse/document/chat", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};
