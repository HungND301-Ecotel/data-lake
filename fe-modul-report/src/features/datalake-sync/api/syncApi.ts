import axiosDataLakeClient from "../../../services/axiosDataLakeClient";
import type { SyncStatus, SyncConfigRequest } from "../types/sync";

export const syncApi = {
  getStatus: async (): Promise<SyncStatus> => {
    const res = await axiosDataLakeClient.get("/api/v1/sync/status");
    return res.data;
  },

  start: async (): Promise<unknown> => {
    const res = await axiosDataLakeClient.post("/api/v1/sync/start");
    return res.data;
  },

  stop: async (): Promise<unknown> => {
    const res = await axiosDataLakeClient.post("/api/v1/sync/stop");
    return res.data;
  },

  trigger: async (): Promise<unknown> => {
    const res = await axiosDataLakeClient.post("/api/v1/sync/trigger");
    return res.data;
  },

  updateConfig: async (config: SyncConfigRequest): Promise<unknown> => {
    const res = await axiosDataLakeClient.put("/api/v1/sync/config", config);
    return res.data;
  },
};
