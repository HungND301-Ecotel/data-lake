import axiosClient from "../../../services/axiosClient";
import type {
  WhBatchDashboardResponse,
  WhBatchDashboardSearch,
} from "../types/whBatch";

export const whBatchApi = {
  /**
   * Lấy danh sách WareBatch cho dashboard.
   * Gọi endpoint POST /wh-batch/dashboard với JSON body.
   */
  getDashboard: async (
    params: WhBatchDashboardSearch,
  ): Promise<WhBatchDashboardResponse[]> => {
    // Xây body – chỉ đưa vào các field có giá trị thực sự
    const body: Record<string, any> = {};

    if (params.departmentId && params.departmentId !== "all") {
      body.departmentId = params.departmentId;
    }
    if (params.reportType) body.reportType = params.reportType;
    if (params.reportYear != null) body.reportYear = params.reportYear;
    if (params.reportMonth != null) body.reportMonth = params.reportMonth;
    if (params.reportDay != null) body.reportDay = params.reportDay;

    // Gọi HTTP POST với body JSON
    const res = await axiosClient.post(`/wh-batch/dashboard`, body);

    // BE trả về mảng trực tiếp List<WareBatchDashboardResponse>
    const data = res.data;
    const content: WhBatchDashboardResponse[] = Array.isArray(data) ? data : [];

    return content;
  },
};
