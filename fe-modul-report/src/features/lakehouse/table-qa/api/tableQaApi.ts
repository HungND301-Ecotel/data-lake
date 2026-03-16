import axiosDataLakeClient from "../../../../services/axiosDataLakeClient";
import type { TableQaResponse } from "../types/tableQa";

export const tableQaApi = {
  chat: async (file: File, query: string): Promise<TableQaResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("query", query);
    const res = await axiosDataLakeClient.post("/api/v1/lakehouse/table-qa/chat", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },
};
