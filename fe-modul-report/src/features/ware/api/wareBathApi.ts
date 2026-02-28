import axiosClient from "../../../services/axiosClient";
import type { PageResponse } from "../../department/types/department";
import type { WareBatchPush, WareBatchRequest, WareBatchResponse, WareBatchSearch } from "../types/wareBacth";

export const wareBatchApi = {
  searchWareBatch: async (
    params: WareBatchSearch
  ): Promise<PageResponse<WareBatchResponse>> => {
    const { departmentIds, ...rest } = params;

    const res = await axiosClient.get(`/wh-batch`, {
      params: rest,
      paramsSerializer: (p) => {
        const searchParams = new URLSearchParams();

        Object.entries(p).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            searchParams.append(key, String(value));
          }
        });

        departmentIds?.forEach((id) => {
          searchParams.append("departmentIds", id);
        });

        return searchParams.toString();
      },
    });
    return res.data;
  },

  getDetail: async (id: number): Promise<WareBatchResponse> => {
    const res = await axiosClient.get(`/wh-batch/${id}`);
    return res.data;
  },

  saveWareBatch: async (
    request: WareBatchRequest
  ): Promise<string> => {
    const res = await axiosClient.post(`/wh-batch`, request, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  updateWareBatch: async (
    request: WareBatchRequest
  ): Promise<string> => {
    const res = await axiosClient.post(`/wh-batch`, request);
    return res.data;
  },

  deleteWareBatch: async (id: string): Promise<string> => {
    const res = await axiosClient.delete(`/wh-batch/${id}`);
    return res.data;
  },

  pushWareBatch: async (request: WareBatchPush): Promise<any> => {
    const res = await axiosClient.post(`/wh-batch/push`, request);
    return res.data;
  },

  approveBatch: async (id: number): Promise<string> => {
    const res = await axiosClient.put(`/wh-batch/approve`, { wareBatchId: id });
    return res.data;
  },

  rejectBatch: async (id: number): Promise<string> => {
    const res = await axiosClient.put(`/wh-batch/reject`, { wareBatchId: id });
    return res.data;
  },

  getMyApprovals: async (departmentId?: string) => {
    const params = departmentId ? { departmentId } : {};
    const res = await axiosClient.get(`/wh-batch/my-approvals`, { params });
    return res.data;
  },
};