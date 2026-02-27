export interface AnalyzeSchemaRequest {
  connection_string: string;
  database_type: string;
  tables?: string[];
}

export interface AnalyzeSchemaResponse {
  analysis_id: string;
  database_type: string;
  tables_analyzed: number;
  metadata: SqlMetadata;
}

export interface AsyncAnalyzeResponse {
  job_id: string;
}

export interface SqlMetadata {
  database_type: string;
  analysis_id: string;
  tables: SqlTableMetadata[];
  relationships: SqlRelationship[];
  summary: string;
}

export interface SqlTableMetadata {
  table_name: string;
  description: string;
  columns: SqlColumnMetadata[];
  row_count?: number;
}

export interface SqlColumnMetadata {
  column_name: string;
  data_type: string;
  nullable: boolean;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  description: string;
  sample_values?: string[];
}

export interface SqlRelationship {
  from_table: string;
  from_column: string;
  to_table: string;
  to_column: string;
  relationship_type: string;
}
