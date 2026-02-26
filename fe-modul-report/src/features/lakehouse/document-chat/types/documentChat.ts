import type { LakehouseChart } from "../../shared/types/lakehouse";

export interface DocumentChatResponse {
  answer: string;
  session_id: string;
  chart: LakehouseChart | null;
}

export interface DocChatMessage {
  role: "user" | "assistant";
  content: string;
  chart?: LakehouseChart | null;
}
