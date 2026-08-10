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
  maPban: string;
  tenPban: string;
  maNhomPban?: string;
  tenNhomPban?: string;
  maCa?: string;
  tenCa?: string;
  tongNhanLuc: number;
  tongDiLam: number;
  thoLoDiLam: number;
  coDien: number;
  qlyPhongVu: number;
  tongVangMat: number;
  om: number;
  phep: number;
  tuTuc: number;
  hoiHop: number;
  vang: number;
  thoLoVangTrongNgay: number;
}

export interface WorkforceDetailTableProps {
  date?: any;
  departmentId?: any;
  reportDate?: string;
  data?: WorkforceRow[];
  loading?: boolean;
}
