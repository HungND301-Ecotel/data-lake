import axiosClient from "../../../services/axiosClient";
import type { PageResponse } from "../../department/types/department";
import type { ReportStorageRequest, ReportStorageResponse, ReportStorageSearch, StatusCount } from "../types/reportStorage";

export const reportStorageApi = {
    getCountStatusByDepartment: async (departmentId: string): Promise<StatusCount> => {
        const res = await axiosClient.get(`/report-storage/count-status-by-department/${departmentId}`);
        return res.data;
    },
    

  addReportStorage: async (
    request: ReportStorageRequest
  ): Promise<string> => {
    const res = await axiosClient.post("/report-storage", request, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    return res.data;
  },

  deleteReportStorage: async (id: string): Promise<string> => {
    const res = await axiosClient.delete(`/report-storage/${id}`);
    return res.data;
  },

  searchReportStorage: async (
    params: ReportStorageSearch
  ): Promise<PageResponse<ReportStorageResponse>> => {
    const res = await axiosClient.get("/report-storage", { params });
    return res.data;
  },

  /**
   * Gửi dữ liệu nhập tay (từ form Excel UniversJS) lên BE để lưu.
   * Body: { reportCategoryId, reportTemplateId, rows: Array<Record<string, any>> }
   */
  saveDataRows: async (
    reportCategoryId: string,
    reportTemplateId: string,
    rows: Record<string, any>[]
  ): Promise<string> => {
    const res = await axiosClient.post("/report-storage/data-rows", {
      reportCategoryId,
      reportTemplateId,
      rows,
    });
    return res.data;
  },

};