import type { Report } from "../types/report";
import axiosClient from "./axiosClient";


const reportApi = {
  createReport: async (report: Report) => {
    const res = await axiosClient.post<string>("/report", report);
    return res.data;
  },

  deleteReportById: async (id: string) => {
    const res = await axiosClient.delete(`/report/${id}`);
    return res.data;
  },

  getReportById: async (reportId: string) => {
    const res = await axiosClient.get<Report>(`/report/${reportId}`);
    return res.data;
  },

  deleteReportItemById: async (reportItemId: string) => {
    const res = await axiosClient.delete<Report>(`/report-item/${reportItemId}`);
    return res.data;
  },

  exportPdf: async (report: Report) => {
    const res = await axiosClient.post("/pdf", report, {
      responseType: "arraybuffer",
    });
    return res.data;
  },

  getReportAll: async () => {
    const res = await axiosClient.get<Report[]>(`/report`);
    return res.data;
  },

  addReport: async (report: Report) => {
    const res = await axiosClient.post<string>("/report", report);
    return res.data;
  },

  deleteItemById: async (itemId: string) => {
    const res = await axiosClient.delete<Report>(`/report-item/${itemId}`);
    return res.data;
  },

  deleteSubById: async (subId: string) => {
    const res = await axiosClient.delete<Report>(`/sub/${subId}`);
    return res.data;
  },

  deleteFieldById: async (fieldId: string) => {
    const res = await axiosClient.delete<Report>(`/field/${fieldId}`);
    return res.data;
  },

  deleteFilterById: async (filterId: string) => {
    const res = await axiosClient.delete<Report>(`/field/${filterId}`);
    return res.data;
  },

  deleteOrderById: async (orderId: string) => {
    const res = await axiosClient.delete<Report>(`/field/${orderId}`);
    return res.data;
  },

  queryList: async (query: string) => {
    const res = await axiosClient.get<[]>(`/data/query-map`, {
      params: { query },
    });
    return res.data;
  },

  
};

export default reportApi;
