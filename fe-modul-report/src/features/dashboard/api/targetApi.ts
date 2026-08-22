import axiosClient from "../../../services/axiosClient";
import type { TargetRequest, TargetResponse, UpdateTargetRequest } from "../types/target";

export const targetApi = {
  getTargets: async (departmentId: string, month: string): Promise<TargetResponse[]> => {
    const res = await axiosClient.get("/targets", {
      params: { departmentId, month }
    });
    return res.data;
  },

  createTarget: async (request: TargetRequest): Promise<TargetResponse> => {
    const res = await axiosClient.post("/targets", request);
    return res.data;
  },

  updateTarget: async (request: UpdateTargetRequest): Promise<TargetResponse> => {
    const res = await axiosClient.put("/targets", request);
    return res.data;
  },

  deleteTarget: async (id: string): Promise<void> => {
    await axiosClient.delete(`/targets/${id}`);
  },
};
