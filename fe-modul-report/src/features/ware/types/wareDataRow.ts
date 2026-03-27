export interface WareDataRowResponse {
  id: number;
  wareBatchId: number;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WareDataRowSearch {
  page?: number;
  limit?: number;
  keyword?: string;
  wareBatchId?: number | null;
  sort?: "ASC" | "DESC";
  sortBy?: string;
}
