import type { WhBatchDashboardResponse, WhBatchDashboardSearch } from "../types/whBatch";

export const whBatchApi = {
  getDashboard: async (
    params: WhBatchDashboardSearch
  ): Promise<WhBatchDashboardResponse[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 150));

    const year = params.reportYear ?? 2026;
    const month = params.reportMonth ?? 6;
    const day = params.reportDay ?? 15;
    const deptId = params.departmentId;
    const type = params.reportType;

    const formattedMonth = String(month).padStart(2, "0");
    const formattedDay = String(day).padStart(2, "0");
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

    // Mock data pool
    const mockData: WhBatchDashboardResponse[] = [
      // Internal reports (Noi_Bo)
      {
        id: 1,
        code: "WB001",
        name: `Báo cáo sản lượng Than nội bộ ngày ${formattedDay}/${formattedMonth}`,
        tableCode: "T_SXT_02",
        reportName: "Báo cáo doanh thu sản xuất",
        description: "Báo cáo doanh thu nội bộ khai thác than nguyên khai",
        s3FileKey: `reports/${year}/${formattedMonth}/report_coal_internal_${dateStr}.xlsx`,
        createdAt: `${dateStr}T08:30:00`,
        updatedAt: `${dateStr}T09:00:00`,
        employeeName: "Nguyễn Văn A",
        wareBatchStatus: "SUCCESS",
        isPushed: true,
        reportYear: year,
        reportMonth: month,
        reportDay: day,
        departmentId: "c688a5fe-19a4-4805-baaa-2ad778e0d680", // Ban sản xuất
      },
      {
        id: 2,
        code: "WB002",
        name: `Báo cáo lao động chi tiết ngày ${formattedDay}/${formattedMonth}`,
        tableCode: "T_KH_13",
        reportName: "Báo cáo nhân lực",
        description: "Thống kê nhân sự đi làm và tai nạn lao động",
        s3FileKey: `reports/${year}/${formattedMonth}/report_workforce_${dateStr}.xlsx`,
        createdAt: `${dateStr}T07:45:00`,
        updatedAt: `${dateStr}T08:15:00`,
        employeeName: "Trần Văn B",
        wareBatchStatus: "PENDING",
        isPushed: false,
        reportYear: year,
        reportMonth: month,
        reportDay: day,
        departmentId: "eb24d7ff-f55c-4927-9577-9bbf5502a07d", // Ban kế hoạch
      },
      {
        id: 3,
        code: "WB003",
        name: `Kế hoạch giải ngân đầu tư tuần ngày ${formattedDay}/${formattedMonth}`,
        tableCode: "T_DT_02",
        reportName: "Kế hoạch giải ngân",
        description: "Báo cáo tiến độ giải ngân các công trình trọng điểm",
        s3FileKey: `reports/${year}/${formattedMonth}/report_disbursement_${dateStr}.xlsx`,
        createdAt: `${dateStr}T10:15:00`,
        updatedAt: `${dateStr}T10:30:00`,
        employeeName: "Lê Văn C",
        wareBatchStatus: "SUCCESS",
        isPushed: true,
        reportYear: year,
        reportMonth: month,
        reportDay: day,
        departmentId: "97524e32-4c46-448a-9956-352f30489620", // Ban đầu tư
      },
      {
        id: 4,
        code: "WB004",
        name: `Báo cáo kiểm kê vật tư dự trữ ngày ${formattedDay}/${formattedMonth}`,
        tableCode: "T_VTTM_01",
        reportName: "Báo cáo vật tư thương mại",
        description: "Báo cáo tồn kho thiết bị phụ tùng cơ giới và bảo hộ lao động",
        s3FileKey: `reports/${year}/${formattedMonth}/report_inventory_${dateStr}.xlsx`,
        createdAt: `${dateStr}T11:00:00`,
        updatedAt: `${dateStr}T11:45:00`,
        employeeName: "Phạm Minh Hoàng",
        wareBatchStatus: "FAILURE",
        isPushed: false,
        reportYear: year,
        reportMonth: month,
        reportDay: day,
        departmentId: "7ca80583-fa05-4586-aae7-34d5ca89ebc3", // Ban vật tư
      },

      // Corporation reports (Tap_Doan)
      {
        id: 101,
        code: "WB101",
        name: `Báo cáo sản lượng Than gửi Tập đoàn ngày ${formattedDay}/${formattedMonth}`,
        tableCode: "T_SXT_02",
        reportName: "Báo cáo sản lượng TKV",
        description: "Số liệu tổng hợp sản lượng than khai thác gửi Tập đoàn TKV",
        s3FileKey: `reports/${year}/${formattedMonth}/report_tkv_coal_production_${dateStr}.xlsx`,
        createdAt: `${dateStr}T09:30:00`,
        updatedAt: `${dateStr}T10:00:00`,
        employeeName: "Nguyễn Văn A",
        wareBatchStatus: "SUCCESS",
        isPushed: true,
        reportYear: year,
        reportMonth: month,
        reportDay: day,
        departmentId: "c688a5fe-19a4-4805-baaa-2ad778e0d680", // Ban sản xuất
      },
      {
        id: 102,
        code: "WB102",
        name: `Báo cáo đất đá bóc lộ thiên gửi TKV ngày ${formattedDay}/${formattedMonth}`,
        tableCode: "T_SXT_21",
        reportName: "Báo cáo đất đá bóc TKV",
        description: "Khối lượng đất đá bóc và đào lò CBSX gửi Tập đoàn",
        s3FileKey: `reports/${year}/${formattedMonth}/report_tkv_excavation_${dateStr}.xlsx`,
        createdAt: `${dateStr}T08:00:00`,
        updatedAt: `${dateStr}T08:45:00`,
        employeeName: "Trần Văn B",
        wareBatchStatus: "SUCCESS",
        isPushed: true,
        reportYear: year,
        reportMonth: month,
        reportDay: day,
        departmentId: "c688a5fe-19a4-4805-baaa-2ad778e0d680", // Ban sản xuất
      },
      {
        id: 103,
        code: "WB103",
        name: `Báo cáo lao động & nhân sự TKV ngày ${formattedDay}/${formattedMonth}`,
        tableCode: "T_KH_13",
        reportName: "Báo cáo lao động TKV",
        description: "Báo cáo tình hình sử dụng nhân lực thợ lò gửi Tập đoàn",
        s3FileKey: `reports/${year}/${formattedMonth}/report_tkv_labor_${dateStr}.xlsx`,
        createdAt: `${dateStr}T10:00:00`,
        updatedAt: `${dateStr}T10:30:00`,
        employeeName: "Lê Văn C",
        wareBatchStatus: "PENDING",
        isPushed: false,
        reportYear: year,
        reportMonth: month,
        reportDay: day,
        departmentId: "eb24d7ff-f55c-4927-9577-9bbf5502a07d", // Ban kế hoạch
      },
    ];

    // Filter logic
    return mockData.filter((item) => {
      // 1. Filter by reportType
      if (type === "Noi_Bo" && item.id >= 100) return false;
      if (type === "Tap_Doan" && item.id < 100) return false;

      // 2. Filter by departmentId
      if (deptId && deptId !== "all" && item.departmentId !== deptId) return false;

      return true;
    });
  },
};
