import axiosClient from "../../../services/axiosClient";
import type { SyncConnectionConfig, SyncConnectionConfigRequest } from "../types/server";

export const serverApi = {
  getAll: async (): Promise<{ data: SyncConnectionConfig[]; message: string }> => {
    const res = await axiosClient.get("/sync_connection_configs");
    return res.data;
  },

  create: async (data: SyncConnectionConfigRequest): Promise<{ data: SyncConnectionConfig; message: string }> => {
    const res = await axiosClient.post("/sync_connection_configs", data);
    return res.data;
  },

  update: async (id: string, data: SyncConnectionConfigRequest): Promise<{ data: SyncConnectionConfig; message: string }> => {
    const res = await axiosClient.put(`/sync_connection_configs/${id}`, data);
    return res.data;
  },

  deleteById: async (id: string): Promise<{ data: SyncConnectionConfig; message: string }> => {
    const res = await axiosClient.delete(`/sync_connection_configs/${id}`);
    return res.data;
  },
};
