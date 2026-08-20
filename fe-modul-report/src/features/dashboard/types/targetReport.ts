export interface TargetReportRequest {
  id?: string | null;
  date: string; // Format: YYYY-MM-DD
  targetId: string;
  productionOrderId?: number | null;
  productionDate: string; // Format: YYYY-MM-DD
  totalDays?: number | null;
  targetPerDay?: number | null;
  shiftDone: number; // caDaThiCong
  shiftPlus?: number | null;
  shiftRemain?: number | null;
  targetPerDayRemain?: number | null;
  performDone: number; // thucHienNgay
  monthLyCumulative?: number | null;
  donePercent?: number | null;
}

export interface TargetReportResponse {
  id: string;
  targetId: string;
  targetName: string;
  code: string;
  unit: string;
  value: number; // monthly target value
  productionOrderId?: number | null;
  productionDate: string; // Format: YYYY-MM-DD
  totalDays?: number | null;
  targetPerDay?: number | null;
  shiftDone?: number | null;
  shiftPlus?: number | null;
  shiftRemain?: number | null;
  targetPerDayRemain?: number | null;
  performDone?: number | null;
  monthLyCumulative?: number | null;
  donePercent?: number | null;
  children?: TargetReportResponse[];
}

export interface DepartmentTargetResponse {
  departmentId: string;
  departmentName: string;
  date: string; // Format: YYYY-MM-DD
  targetReportResponseList: TargetReportResponse[];
  children?: DepartmentTargetResponse[];
}
