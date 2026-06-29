import axiosClient from "../../../services/axiosClient";
import type {
  TargetReportRequest,
  TargetReportResponse,
  DepartmentTargetResponse,
} from "../types/targetReport";

export const targetReportApi = {
  createBulk: async (
    requests: TargetReportRequest[],
  ): Promise<TargetReportResponse[]> => {
    const res = await axiosClient.post("/target-reports/bulk", requests);
    return res.data;
  },

  updateBulk: async (
    requests: TargetReportRequest[],
  ): Promise<TargetReportResponse[]> => {
    const res = await axiosClient.put("/target-reports/bulk", requests);
    return res.data;
  },

  getAll: async (dateStr: string): Promise<DepartmentTargetResponse[]> => {
    const res = await axiosClient.get("/target-reports", {
      params: { date: dateStr },
    });
    return res.data;
  },

  getTargetReportByDepartmentAndMonth: async (
    departmentId: string,
    date: string,
  ): Promise<TargetReportResponse[]> => {
    const res = await axiosClient.get(`/target-reports/list`, {
      params: { departmentId, date },
    });
    return res.data;
  },

  getDatesInMonth: async (
    departmentId: string,
    date: string,
  ): Promise<string[]> => {
    const res = await axiosClient.get("/target-reports/date-in-month", {
      params: { departmentId, date },
    });
    return res.data;
  },
};
