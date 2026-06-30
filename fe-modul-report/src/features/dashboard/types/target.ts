export interface TargetRequest {
  id?: string;
  name: string;
  code: string;
  unit: string;
  value: number;
  month: string; // Format: YYYY-MM
  departmentId: string;
  parentId?: string | null;
}

export interface UpdateTargetRequest extends TargetRequest {
  id: string;
}

export interface TargetResponse {
  id: string;
  name: string;
  code: string;
  unit: string;
  value: number;
  month: string;
  departmentId: string;
  departmentName?: string;
  parentId?: string | null;
}
