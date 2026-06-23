// ============ Server Management ============

export interface ServerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  driver: string;
  trust_cert: boolean;
  windows_auth: boolean;
  is_default: boolean;
  created_at: string;
}

export interface ServerListResponse {
  servers: ServerConfig[];
  total: number;
}

export interface ServerCreateRequest {
  name: string;
  host: string;
  port?: number;
  username?: string;
  password: string;
  driver?: string;
  trust_cert?: boolean;
  windows_auth?: boolean;
}

export interface ServerUpdateRequest {
  name?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  trust_cert?: boolean;
  windows_auth?: boolean;
}

export interface ServerTestResponse {
  success: boolean;
  message: string;
  databases: string[];
}

// ============ Remote Import ============

export interface RemoteImportRequest {
  source_server_id: string;
  source_database: string;
  target_server_id?: string | null;
  bronze_database?: string;
  tables?: string[] | null;
}

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

// ============ Value Mapping ============

export interface ValueMappingEntry {
  from_value: string;
  to_value: string;
}

export interface ValueMappingSaveRequest {
  name: string;
  description?: string | null;
  case_insensitive?: boolean;
  match_mode?: "exact" | "contains" | "word";
  mappings: ValueMappingEntry[];
}

export interface ValueMappingConfig {
  name: string;
  description: string | null;
  case_insensitive: boolean;
  match_mode: "exact" | "contains" | "word";
  mappings: ValueMappingEntry[];
  created_at: string;
}

export interface ValueMappingSaveResponse {
  status: string;
  mapping: ValueMappingConfig;
}

export interface ValueMappingListItem {
  name: string;
  description: string | null;
  mapping_count: number;
  match_mode: string;
  created_at: string;
}

export interface ValueMappingListResponse {
  mappings: ValueMappingListItem[];
}

export interface ValueMappingApplyRequest {
  database: string;
  server_id?: string | null;
  tables?: string[] | null;
  columns?: string[] | null;
  mapping_name?: string | null;
  custom_mappings?: ValueMappingEntry[] | null;
  case_insensitive?: boolean;
  match_mode?: "exact" | "contains" | "word";
  dry_run?: boolean;
}

export interface ValueMappingResultDetail {
  column: string;
  from_value: string;
  to_value: string;
  matches: number;
  applied: boolean;
}

export interface ValueMappingTableResult {
  table_name: string;
  columns_scanned: number;
  total_replacements: number;
  details: ValueMappingResultDetail[];
}

export interface ValueMappingApplyResponse {
  status: string;
  database: string;
  tables_processed: string[];
  total_replacements: number;
  results: ValueMappingTableResult[];
  dry_run: boolean;
  message: string;
}

// ============ Chat SSE Streaming ============

export type ChatSSEEventType =
  | "start" | "schema_loaded" | "sql_generating" | "sql_generated" | "sql_fixed"
  | "query_executing" | "query_result" | "answer_streaming" | "answer_token"
  | "answer_done" | "data" | "chart" | "complete" | "error";

export interface ChatSSEEvent {
  event: ChatSSEEventType;
  // start
  session_id?: string;
  question?: string;
  database?: string;
  // schema_loaded
  tables_count?: number;
  // sql
  sql_query?: string;
  // query_result
  columns?: string[];
  total_rows?: number;
  data_preview?: Record<string, unknown>[];
  // answer_token
  token?: string;
  // answer_done
  answer?: string;
  // data
  data?: Record<string, unknown>[];
  // chart
  chart?: PlotlyChart;
  // general
  message?: string;
}

// ============ Pipeline SSE Streaming ============

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
