import axiosClient from "../../../services/axiosClient";
import type { WareMappingRequest, WareMappingResponse, WareMappingSearch } from "../types/wareMapping";

export const wareMappingApi = {
  searchWareMapping: async (
    params: WareMappingSearch
  ): Promise<WareMappingResponse[]> => {
    const res = await axiosClient.get(`/wh-mapping`, { params });
    return res.data;
  },

  saveWareMapping: async (
    request: WareMappingRequest
  ): Promise<string> => {
    const res = await axiosClient.post(`/wh-mapping`, request);
    return res.data;
  },

  updateWareMapping: async (
    request: WareMappingRequest
  ): Promise<string> => {
    const res = await axiosClient.put(`/wh-mapping`, request);
    return res.data;
  },

//   updateWareMapping: async (
//     request: WareMappingRequest
//   ): Promise<string> => {
//     const res = await axiosClient.post(`/wh-mapping`, request);
//     return res.data;
//   },

  deleteWareMapping: async (id: string): Promise<string> => {
    const res = await axiosClient.delete(`/wh-mapping/${id}`);
    return res.data;
  },


  getByBatch: async (id: number): Promise<WareMappingResponse[]> => {
    const res = await axiosClient.get(`/wh-mapping/batch/${id}`);
    return res.data;
  },
};
