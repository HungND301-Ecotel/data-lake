export interface WareBatchRequest {
  id?: number | null;
  name: string;
  description: string;
  file?: File | null;
  wareTemplateId: number | null;
  year: number;
  period: number;
}

export interface WareBatchResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  employeeName?: string | null;
  year: number;
  period: number;
}

export interface WareBatchSearch {
  page?: number;
  limit?: number;
  keyword?: string | null;
  wareTemplateId?: number | null;
}

export interface WareBatchPush {
  id: number;
  deleteMissing: boolean;
}

