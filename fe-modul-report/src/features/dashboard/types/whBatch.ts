export interface WhBatchDashboardResponse {
  id: number;
  code: string;
  name: string;
  tableCode: string;
  reportName: string;
  description: string;
  s3FileKey: string;
  createdAt: string;
  updatedAt: string;
  employeeName: string;
  wareBatchStatus: "SUCCESS" | "PENDING" | "FAILURE";
  isPushed: boolean;
  reportYear: number;
  reportMonth: number;
  reportDay: number;
  departmentId: string;
}

export interface WhBatchDashboardSearch {
  departmentId?: string | null;
  reportType?: "Noi_Bo" | "Tap_Doan";
  reportYear?: number;
  reportMonth?: number;
  reportDay?: number;
}
