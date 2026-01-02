import axiosClient from "../../../services/axiosClient";
import type { WareTemplateRequest, WareTemplateResponse, WareTemplateSearch } from "../types/wareTemplate";

export const wareTemplateApi = {
  searchWareTemplate: async (
    params: WareTemplateSearch
  ): Promise<WareTemplateResponse[]> => {
    const res = await axiosClient.get(`/wh-template`, { params });
    return res.data;
  },

  saveWareTemplate: async (
    request: WareTemplateRequest
  ): Promise<string> => {
    const res = await axiosClient.post(`/wh-template`, request);
    return res.data;
  },

  updateWareTemplate: async (
    request: WareTemplateRequest
  ): Promise<string> => {
    const res = await axiosClient.put(`/wh-template`, request);
    return res.data;
  },

  deleteWareTemplate: async (id: number): Promise<string> => {
    const res = await axiosClient.delete(`/wh-template/${id}`);
    return res.data;
  },


  getWareTemplateById: async (id: number): Promise<WareTemplateResponse> => {
    const res = await axiosClient.get(`/wh-template/${id}`);
    return res.data;
  },

};
