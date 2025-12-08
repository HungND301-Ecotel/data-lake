import type { PageResponse } from "../types/department";
import type { ReportCategoryCount, ReportCategoryRequest, ReportCategoryResponse, ReportCategorySearch } from "../types/report";
import axiosClient from "./axiosClient";

export const reportCategoryApi = {
  searchReportCategory: async (
    params: ReportCategorySearch
  ): Promise<PageResponse<ReportCategoryResponse>> => {
    const res = await axiosClient.get("/report-category", { params });
    return res.data;
  },

  saveReportCategory: async (
    request: ReportCategoryRequest
  ): Promise<string> => {
    const res = await axiosClient.post("/report-category", request);
    return res.data;
  },

  deleteReportCategory: async (id: string): Promise<string> => {
    const res = await axiosClient.delete(`/report-category/${id}`);
    return res.data;
  },

  findById: async (id: string): Promise<ReportCategoryResponse> => {
    const res = await axiosClient.get(`/report-category/${id}`);
    return res.data;
  },

  getCountByDepartment: async (id: string): Promise<ReportCategoryCount> => {
    const res = await axiosClient.get(`/report-category/count/${id}`);
    return res.data;
  },
};
