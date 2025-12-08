export interface DepartmentResponse {
    id: string | null;
    code: string;
    name: string;
    description: string;
  }
  
  export interface PageResponse<T> {
    page: number;
    limit: number;
    totalElements: number;
    totalPages: number;
    content: T[];
  }
  