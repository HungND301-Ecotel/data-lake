export interface ChatMessage {
  id: string;
  role: "human" | "ai" | "user";
  content: string;
  timestamp?: string;
  sources?: ChatSource[];
  chart?: ChatChartData;
  data?: ChatTableData;
  db_query?: DbQueryResult;
}

export interface ChatSource {
  metadata?: {
    source?: string;
    table?: string;
  };
  content?: string;
}

export interface ChatChartData {
  title?: string;
  chart_json?: {
    data: PlotlyTrace[];
    layout?: Record<string, unknown>;
  };
}

export interface PlotlyTrace {
  x?: (string | number)[];
  y?: (string | number)[];
  values?: number[];
  labels?: string[];
  type?: string;
  mode?: string;
  name?: string;
  fill?: string;
  marker?: Record<string, unknown>;
  line?: Record<string, unknown>;
}

export interface ChatTableData {
  columns: string[];
  rows: Record<string, string | number>[];
  source?: string;
}

export interface DbQueryResult {
  columns: string[];
  rows: Record<string, string | number | null>[];
  total_rows: number;
  generated_query: string;
  source: string;
  error: string | null;
}

export interface ChatSession {
  session_id: string;
  last_message?: string;
  last_role?: string;
  message_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface ChatSendResponse {
  answer: string;
  session_id: string;
  timestamp: string;
  sources?: ChatSource[];
  chart?: ChatChartData;
  data?: ChatTableData;
  db_query?: DbQueryResult;
}

export interface ChatSessionsResponse {
  sessions: ChatSession[];
}

export interface ChatHistoryResponse {
  messages: { role: string; content: string }[];
}
