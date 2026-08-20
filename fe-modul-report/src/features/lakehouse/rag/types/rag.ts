import type { LakehouseChart } from "../../shared/types/lakehouse";

export interface RagIngestRequest {
  file_ids: string[];
}

export interface RagIngestResponse {
  status: string;
  documents_processed: number;
}

export interface RagChatRequest {
  query: string;
  history?: { role: string; content: string }[];
}

export interface RagChatResponse {
  answer: string;
  sources: { file_id: string }[];
  chart: LakehouseChart | null;
}

export interface RagSearchRequest {
  query: string;
  top_k?: number;
}

export interface RagSearchResultItem {
  score: number;
  raw: { file_id: string; filename: string; upload_timestamp: string } | null;
  bronze: { file_id: string; extracted_text: string } | null;
  silver: { file_id: string; structured_data_url: string; preview_data: { field: string; value: string }[] } | null;
  gold: unknown[];
}

export interface RagSearchResponse {
  results: RagSearchResultItem[];
}

export interface RagMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { file_id: string }[];
  chart?: LakehouseChart | null;
}
