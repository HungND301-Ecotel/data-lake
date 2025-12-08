import axiosClient from "./axiosClient";
import type { DepartmentResponse, PageResponse } from "../types/department";

export const departmentApi = {
  searchDepartment: async (
    keyword: string,
    page: number = 0,
    limit: number = 10
  ): Promise<PageResponse<DepartmentResponse>> => {
    const res = await axiosClient.get("/department", {
      params: { keyword, page, limit },
    });
    return res.data;
  },

  saveDepartment: async (request: DepartmentResponse): Promise<string> => {
    const res = await axiosClient.post("/department", request);
    return res.data;
  },

  deleteDepartment: async (departmentId: String | null): Promise<string> => {
    const res = await axiosClient.delete(`/department/${departmentId}`);
    return res.data;
  },
  
  getMyDepartment: async (
    keyword: string,
    page: number = 0,
    limit: number = 10
  ): Promise<PageResponse<DepartmentResponse>> => {
    const res = await axiosClient.get("/department/my", {
      params: { keyword, page, limit },
    });
    return res.data;
  },
};
