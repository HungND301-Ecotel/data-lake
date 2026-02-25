import axiosDataLakeClient from "../../../services/axiosDataLakeClient";
import type {
  ServerConfig,
  ServerCreateRequest,
  ServerUpdateRequest,
  ServerListResponse,
  TestConnectionResult,
  ServerDeleteResponse,
  SetDefaultResponse,
} from "../types/server";

export const serverApi = {
  getAll: async (): Promise<ServerListResponse> => {
    const res = await axiosDataLakeClient.get("/api/v1/servers");
    return res.data;
  },

  getById: async (serverId: string): Promise<ServerConfig> => {
    const res = await axiosDataLakeClient.get(`/api/v1/servers/${serverId}`);
    return res.data;
  },

  create: async (data: ServerCreateRequest): Promise<ServerConfig> => {
    const res = await axiosDataLakeClient.post("/api/v1/servers", data);
    return res.data;
  },

  update: async (serverId: string, data: ServerUpdateRequest): Promise<ServerConfig> => {
    const res = await axiosDataLakeClient.put(`/api/v1/servers/${serverId}`, data);
    return res.data;
  },

  delete: async (serverId: string): Promise<ServerDeleteResponse> => {
    const res = await axiosDataLakeClient.delete(`/api/v1/servers/${serverId}`);
    return res.data;
  },

  testConnection: async (serverId: string): Promise<TestConnectionResult> => {
    const res = await axiosDataLakeClient.post(`/api/v1/servers/${serverId}/test`);
    return res.data;
  },

  setDefault: async (serverId: string): Promise<SetDefaultResponse> => {
    const res = await axiosDataLakeClient.post(`/api/v1/servers/${serverId}/set-default`);
    return res.data;
  },

  getDatabases: async (serverId: string): Promise<string[]> => {
    const res = await axiosDataLakeClient.get(`/api/v1/servers/${serverId}/databases`);
    return res.data;
  },
};
