export interface ReportStorageRequest {
    id?: string;
    name: string;
    description?: string;
    note?: string;
    file?: File;
    reportCategoryId?: string;
  }
  
  export interface ReportStorageResponse {
    id: string;
    name: string;
    description?: string;
    note?: string;
    fileKey?: string;
    fileType?: string;
    reportCategoryName?: string;
    employeeName?: string;
    createdAt?: string;
    status?: string;
  }
  
  export interface ReportStorageSearch {
    page?: number;
    limit?: number; 
    keyword?: string;
    sort?: "ASC" | "DESC";
    sortBy?: string;
    reportCategoryId?: string | null;
    status?: string | null;
  }
  
  export interface StatusCount {
    [status: string]: number;
  }
  
  