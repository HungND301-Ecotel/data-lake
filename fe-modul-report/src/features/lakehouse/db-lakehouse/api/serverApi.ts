import axiosDataLakeClient from "../../../../services/axiosDataLakeClient";
import type {
  ServerListResponse,
  ServerConfig,
  ServerCreateRequest,
  ServerUpdateRequest,
  ServerTestResponse,
} from "../types/dbLakehouse";

const BASE = "/api/v1/servers";

export const serverApi = {
  list: async (): Promise<ServerListResponse> => {
    const res = await axiosDataLakeClient.get(BASE);
    return res.data;
  },

  create: async (body: ServerCreateRequest): Promise<ServerConfig> => {
    const res = await axiosDataLakeClient.post(BASE, body);
    return res.data;
  },

  update: async (serverId: string, body: ServerUpdateRequest): Promise<ServerConfig> => {
    const res = await axiosDataLakeClient.put(`${BASE}/${serverId}`, body);
    return res.data;
  },

  delete: async (serverId: string): Promise<void> => {
    await axiosDataLakeClient.delete(`${BASE}/${serverId}`);
  },

  test: async (serverId: string): Promise<ServerTestResponse> => {
    const res = await axiosDataLakeClient.post(`${BASE}/${serverId}/test`);
    return res.data;
  },

  getDatabases: async (serverId: string): Promise<string[]> => {
    const res = await axiosDataLakeClient.get(`${BASE}/${serverId}/databases`);
    return res.data;
  },

  setDefault: async (serverId: string): Promise<{ status: string; message: string }> => {
    const res = await axiosDataLakeClient.post(`${BASE}/${serverId}/set-default`);
    return res.data;
  },
};
