import axiosClient from "../../../services/axiosClient";
import type { WhBatchDashboardResponse, WhBatchDashboardSearch } from "../types/whBatch";

export const whBatchApi = {
  /**
   * Lấy danh sách WareBatch cho dashboard.
   * Gọi endpoint GET /wh-batch/dashboard với JSON body (Spring @RequestBody).
   *
   * Body gửi lên:
   * {
   *   departmentId?: string,
   *   reportType?:   "Noi_Bo" | "Tap_Doan",
   *   reportYear?:   number,
   *   reportMonth?:  number,
   *   reportDay?:    number,
   * }
   */
  getDashboard: async (
    params: WhBatchDashboardSearch
  ): Promise<WhBatchDashboardResponse[]> => {
    // Xây body – chỉ đưa vào các field có giá trị thực sự
    const body: Record<string, any> = {};

    if (params.departmentId && params.departmentId !== "all") {
      body.departmentId = params.departmentId;
    }
    if (params.reportType)               body.reportType  = params.reportType;
    if (params.reportYear  != null)      body.reportYear  = params.reportYear;
    if (params.reportMonth != null)      body.reportMonth = params.reportMonth;
    if (params.reportDay   != null)      body.reportDay   = params.reportDay;

    // GET với body: dùng option `data` của axios
    const res = await axiosClient.get(`/wh-batch/dashboard`, { data: body });

    // BE trả về mảng trực tiếp List<WareBatchDashboardResponse>
    const data = res.data;
    const content: WhBatchDashboardResponse[] = Array.isArray(data) ? data : [];

    return content;
  },
};
