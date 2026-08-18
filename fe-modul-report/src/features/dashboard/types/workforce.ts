export interface WorkforceCaRow {
  shiftName: string;
  tongNhanLuc?: number;
  diLamTong: number;
  diLamThoLo: number;
  diLamCoDien: number;
  diLamQlpv: number;
  vangTong: number;
  vangO: number;
  vangP: number;
  vangTt: number;
  vangH: number;
  tuTuc?: number;
  hoiHop?: number;
  vangV: number;
  tLoVang: number;
}

export interface WorkforceRow {
  id: string;
  stt?: string;
  ten: string;
  level: number;
  isTotal?: boolean;
  highlight?: boolean;
  tongNhanLuc?: number;
  shifts?: WorkforceCaRow[];
  children?: WorkforceRow[];
}

export interface WorkforceApiResponse {
  departmentCode: string;
  departmentName: string;
  departmentGroupCode?: string;
  departmentGroupName?: string;
  shiftCode?: string;
  shiftName?: string;
  totalHeadcount: number;
  totalWorking: number;
  undergroundWorkers: number;
  electricalAndOtherWorkers: number;
  managementAndSupport: number;
  totalAbsent: number;
  sickLeave: number;
  annualLeave: number;
  maternityLeave: number;
  meetingAndTraining: number;
  unauthorizedAbsence: number;
  undergroundWorkersAbsent: number;
}

export interface WorkforceDetailTableProps {
  date?: any;
  departmentId?: any;
  reportDate?: string;
  data?: WorkforceRow[];
  loading?: boolean;
}
