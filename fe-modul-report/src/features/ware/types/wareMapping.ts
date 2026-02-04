export interface WareMappingRequest {
  id?: number | null;
  fieldTitle?: string;
  fieldName: string;
  fieldValue?: string;
  fieldType?: "ROW" | "CELL" | "TEXT";
  isKeyColumn?: boolean;
  isScopFilter?: boolean;
  cellAddress?: string;
  wareTemplateId: number;
}

export interface WareMappingResponse {
  id: number | null;
  fieldTitle?: string;
  fieldName: string;
  fieldValue?: string;
  fieldType?: "ROW" | "CELL" | "TEXT";
  isKeyColumn?: boolean;
  isScopFilter?: boolean;
  cellAddress?: string;
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
