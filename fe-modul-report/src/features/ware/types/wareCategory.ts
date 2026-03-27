export interface WareCategoryResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  departmentId: string;
}

export interface WareCategorySearch {
  page?: number;
  limit?: number;
  keyword?: string | null;
  departmentId?: string | null;
}

export interface WareCategoryRequest {
  id?: number;
  code: string;
  name: string;
  description?: string;
  departmentId: string;
  departmentName?: string;
  departmentCode?: string;
}
