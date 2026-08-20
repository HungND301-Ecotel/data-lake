export interface HealthStatus {
  status: string;
  version?: string;
  timestamp?: string;
}

export interface ReadyStatus {
  ready: boolean;
  checks?: {
    vector_store_loaded: boolean;
    llm_configured: boolean;
    document_count?: number;
  };
}

export interface DataStatus {
  vector_store_loaded: boolean;
  document_count: number;
  excel_files_count: number;
  bak_files_count: number;
  index_path?: string;
  excel_files?: string[];
  bak_files?: string[];
}

export interface DataSource {
  name: string;
  type: "excel" | "sqlserver_backup" | string;
  size_bytes?: number;
  created_at?: string;
  tables?: string[];
}

export interface ImportConfig {
  database: string;
  tables: string;
  rowLimit: number;
}
