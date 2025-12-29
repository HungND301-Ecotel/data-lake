export interface ReportTemplateRequest {
    id?: string;
    name?: string;
    description?: string;
    reportType?: string;
    file?: File;      
    reportId?: string;
    reportCategoryId?: string;
  }

  export interface ReportTemplateResponse {
    id?: string;
    name?: string;
    description?: string;
    fileType?: string;
    reportType?: string;
    fileKey?: string;
    reportId?: string;
    reportCategoryName?: string;
    employeeName?: string;
    createdAt: string;
  }
  