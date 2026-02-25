export interface DatabaseListResponse {
  databases: string[];
  total: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  max_length: number | null;
  precision: number | null;
}

export interface TableSchema {
  table_name: string;
  columns: ColumnInfo[];
}

export interface SchemaResponse {
  database: string;
  tables: TableSchema[];
  total_tables: number;
}

export interface TableQueryRequest {
  database: string;
  table: string;
  columns?: string[] | null;
  where?: string | null;
  limit?: number;
  server_id?: string;
}

export interface TableQueryResponse {
  columns: string[];
  rows: Record<string, unknown>[];
  total_rows: number;
  returned_rows: number;
  source: string;
  error: string | null;
}

export interface NaturalQueryRequest {
  question: string;
  database: string;
  server_id?: string;
}

export interface NaturalQueryResponse {
  columns: string[];
  rows: Record<string, unknown>[];
  total_rows: number;
  generated_query: string | null;
  source: string;
  error: string | null;
  no_query: boolean;
}
