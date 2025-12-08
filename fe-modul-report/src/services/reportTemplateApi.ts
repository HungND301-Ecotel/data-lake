import type { ReportTemplateRequest, ReportTemplateResponse } from "../types/reportTemplate";
import axiosClient from "./axiosClient";

export const reportTemplateApi = {
  addReportTemplate: async (
    request: ReportTemplateRequest
  ): Promise<string> => {
    const res = await axiosClient.post("/report-template", request, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    return res.data;
  },

  deleteReportTemplate: async (id: string): Promise<string> => {
    const res = await axiosClient.delete(`/report-template/${id}`);
    return res.data;
  },

  getByCategory: async (id: string): Promise<ReportTemplateResponse> => {
    const res = await axiosClient.get(`/report-template/category-report/${id}`);
    return res.data;
  },


};