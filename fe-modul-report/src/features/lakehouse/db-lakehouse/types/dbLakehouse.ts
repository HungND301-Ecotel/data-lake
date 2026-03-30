// ============ Bronze Layer ============

export interface BronzeUploadResponse {
  status: string;
  bronze_database: string;
  tables_imported: string[];
  table_count: number;
  total_rows: number;
  message: string;
}

export interface BronzeImportRequest {
  server_id?: string | null;
  database_name?: string;
  tables?: string[] | null;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  max_length: number | null;
}

export interface TableInfo {
  table_name: string;
  row_count: number;
  column_count: number;
  columns: ColumnInfo[];
}

export interface DatabaseInfoResponse {
  database_name: string;
  layer: "bronze" | "silver" | "gold";
  tables: TableInfo[];
  total_rows: number;
  total_tables: number;
}

// ============ Silver Layer ============

export interface CleaningRule {
  column: string;
  action: "trim" | "lowercase" | "uppercase" | "fill_default" | "cast_type" | "remove_empty_strings" | "regex_replace" | "normalize_date";
  params?: Record<string, string> | null;
}

export interface SilverTransformRequest {
  bronze_database: string;
  silver_database?: string;
  tables?: string[] | null;
  auto_clean?: boolean;
  custom_rules?: CleaningRule[] | null;
  remove_duplicates?: boolean;
  remove_null_rows?: boolean;
}

export interface CleaningTableReport {
  original_rows: number;
  cleaned_rows: number;
  duplicates_removed: number;
  nulls_filled: number;
  issues_found: string[];
  actions_applied: string[];
}

export interface SilverTransformResponse {
  status: string;
  bronze_database: string;
  silver_database: string;
  tables_transformed: string[];
  cleaning_report: Record<string, CleaningTableReport>;
  message: string;
}

// ============ Gold Layer ============

export interface GoldColumnMapping {
  source_column: string;
  target_column?: string;
  transform?: "normalize_date" | "normalize_phone" | "normalize_name" | "uppercase" | "lowercase" | "trim" | "format_currency" | "cast_type";
  params?: Record<string, string | number> | null;
}

export interface GoldTableMapping {
  source_table: string;
  target_table?: string;
  columns?: GoldColumnMapping[] | null;
  exclude_columns?: string[];
}

export interface GoldTransformRequest {
  silver_database: string;
  gold_database?: string;
  table_mappings?: GoldTableMapping[] | null;
  auto_standardize?: boolean;
}

export interface StandardizationTableReport {
  source_table: string;
  target_table: string;
  columns_renamed: string[];
  data_transforms: string[];
  rows: number;
}

export interface GoldTransformResponse {
  status: string;
  silver_database: string;
  gold_database: string;
  tables_transformed: string[];
  standardization_report: Record<string, StandardizationTableReport>;
  message: string;
}

// ============ Full Pipeline ============

export interface PipelineRunRequest {
  server_id?: string | null;
  bronze_database?: string;
  silver_database?: string;
  gold_database?: string;
  tables?: string[] | null;
  auto_clean?: boolean;
  auto_standardize?: boolean;
  table_mappings?: GoldTableMapping[] | null;
}

export interface PipelineResponse {
  status: string;
  bronze_database: string;
  silver_database: string;
  gold_database: string;
  tables_processed: number;
  bronze_report: { table_count: number; total_rows: number };
  silver_report: { tables_transformed: string[]; cleaning_report: Record<string, CleaningTableReport> };
  gold_report: { tables_transformed: string[]; standardization_report: Record<string, StandardizationTableReport> };
  message: string;
}

// ============ Chat & Chart ============

export interface ChatRequest {
  question: string;
  database: string;
  server_id?: string | null;
  session_id?: string;
  generate_chart?: boolean;
}

export interface PlotlyChart {
  chart_type: "bar" | "line" | "pie" | "scatter" | "histogram";
  data: Record<string, unknown>[];
  layout: Record<string, unknown>;
}

export interface ChatResponse {
  answer: string;
  sql_query: string | null;
  data: Record<string, unknown>[] | null;
  columns: string[] | null;
  total_rows: number | null;
  chart: PlotlyChart | null;
  session_id: string | null;
}

export interface ChartRequest {
  database: string;
  question: string;
  server_id?: string | null;
  chart_type?: "bar" | "line" | "pie" | "scatter" | "heatmap";
}

export interface ChartResponse {
  chart_type: string;
  chart_config: PlotlyChart;
  sql_query: string;
  data_summary: string;
}

export interface ChatHistoryMessage {
  question: string;
  answer: string;
  timestamp: string;
}

export interface ChatHistoryResponse {
  session_id: string;
  messages: ChatHistoryMessage[];
}

// ============ Database Management ============

export interface DatabaseMeta {
  database: string;
  layer: string;
  source_bak?: string;
  source_bronze?: string;
  source_silver?: string;
  tables: string[];
  total_rows?: number;
  imported_at?: string;
  transformed_at?: string;
}

export interface DatabaseListResponse {
  databases: Record<string, DatabaseMeta>;
}

// ============ SSE Streaming ============

export type SSEEventType =
  // Bronze events
  | "start" | "progress" | "table_done" | "table_error" | "complete" | "error"
  // Silver events
  | "table_start"
  // Pipeline events
  | "pipeline_start" | "pipeline_complete" | "pipeline_error"
  | "bronze_start" | "bronze_progress" | "bronze_table_done" | "bronze_complete"
  | "silver_start" | "silver_table_start" | "silver_table_done" | "silver_complete"
  | "gold_start" | "gold_table_start" | "gold_table_done" | "gold_complete";

export interface SSEEvent {
  event: SSEEventType;
  step?: string;
  pipeline_step?: "bronze" | "silver" | "gold";
  message?: string;
  progress?: number;
  overall_progress?: number;
  // table info
  table?: string;
  target_table?: string;
  row_count?: number;
  column_count?: number;
  tables_done?: number;
  tables_total?: number;
  // complete data
  status?: string;
  bronze_database?: string;
  silver_database?: string;
  gold_database?: string;
  tables_imported?: string[];
  tables_transformed?: string[];
  table_count?: number;
  total_rows?: number;
  report?: CleaningTableReport | StandardizationTableReport;
  cleaning_report?: Record<string, CleaningTableReport>;
  standardization_report?: Record<string, StandardizationTableReport>;
}

export type PipelinePhase = "idle" | "bronze" | "silver" | "gold" | "complete" | "error";

export interface StreamLog {
  event: SSEEventType;
  message: string;
  progress: number;
  phase: PipelinePhase;
  timestamp: string;
  data?: SSEEvent;
}
