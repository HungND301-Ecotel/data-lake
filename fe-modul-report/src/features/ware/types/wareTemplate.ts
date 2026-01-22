export interface WareTemplateRequest {
  id?: number | null;
  code: string | null;
  name: string;
  description: string;
  startRow: number;
  wareCategoryId: number;

  tableName: string;
  tableCode: string;
}
export interface WareTemplateSearch {
  page?: number;
  limit?: number;
  keyword?: string | null;
  wareCategoryId?: number | null;
}
export interface WareTemplateResponse {
  id: number;
  code: string;
  name: string;
  description: string;

  startRow: number;

  tableName: string;
  tableCode: string;

  createdAt: string;
  updatedAt: string;
  hasApprovalConfig: boolean;
}

export interface TableOption {
  id: number;
  tableName: string;
  tableCode: string;
}

