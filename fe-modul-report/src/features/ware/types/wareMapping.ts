export interface WareMappingRequest {
  id?: number | null;
  excelColumn: number;
  fieldName: string;
  fieldType: string;
  defaultValue: string;
  wareTemplateId: number;
}

export interface WareMappingResponse {
  id: number | null;
  excelColumn: number;
  fieldName: string;
  fieldType: string;
  defaultValue?: string | null;
}

export interface WareMappingSearch {
  page?: number;
  limit?: number;
  keyword?: string;
  wareTemplateId?: number | null;
  sort?: "ASC" | "DESC";
  sortBy?: string;
}
