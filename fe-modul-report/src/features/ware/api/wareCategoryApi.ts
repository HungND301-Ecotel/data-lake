import axiosClient from "../../../services/axiosClient";
import type { PageResponse } from "../../department/types/department";
import type { WareCategoryRequest, WareCategoryResponse, WareCategorySearch } from "../types/wareCategory";

export const wareCategoryApi = {
  searchWareCategory: async (
    params: WareCategorySearch
  ): Promise<PageResponse<WareCategoryResponse>> => {
    const res = await axiosClient.get(`/wh-category`, { params });
    return res.data;
  },

  saveWareCategory: async (
    request: WareCategoryRequest
  ): Promise<string> => {
    const res = await axiosClient.post(`/wh-category`, request);
    return res.data;
  },

  updateWareCategory: async (
    request: WareCategoryRequest
  ): Promise<string> => {
    const res = await axiosClient.put(`/wh-category`, request);
    return res.data;
  },

  deleteWareCategory: async (id: string): Promise<string> => {
    const res = await axiosClient.delete(`/wh-category/${id}`);
    return res.data;
  },

};
