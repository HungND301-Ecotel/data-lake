import axiosClient from "../../../services/axiosClient";
import type { PageResponse } from "../../department/types/department";
import type { WareBatchPush, WareBatchRequest, WareBatchResponse, WareBatchSearch } from "../types/wareBacth";

export const wareBatchApi = {
  searchWareBatch: async (
    params: WareBatchSearch
  ): Promise<PageResponse<WareBatchResponse>> => {
    const res = await axiosClient.get(`/wh-batch`, { params });
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
  }

};
