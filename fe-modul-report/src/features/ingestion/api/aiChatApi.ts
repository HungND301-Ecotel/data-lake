/**
 * Client cho AI Chat có kiểm soát (M09) của ai_worker_lake_house.
 * Dùng chung axios instance với module tiếp nhận dữ liệu để thống nhất
 * xác thực và khung lỗi theo mục 8.2.
 */
import { ingestionClient } from "./ingestionApi";

export type AnswerStatus =
  | "ANSWERED"
  | "REFUSED_NO_EVIDENCE"
  | "REFUSED_MODEL_NOT_ALLOWED"
  | "BLOCKED_POLICY";

export interface ChatCitation {
  chunk_id?: string;
  object_id: string;
  version_id: string;
  original_name?: string;
  locator?: string | null;
  score?: number;
  snippet?: string;
}

export interface ChatModelInfo {
  id: string;
  model_id: string;
  version: string;
  provider: string;
  max_security_level: number;
  is_internal: boolean;
  capabilities: string[];
  approval_status: string;
  quota_per_user_day: number | null;
  data_retention: string | null;
  evaluation_set: string | null;
  active: boolean;
}

export interface ChatRouting {
  tools: string[];
  /** Công cụ router nhận diện nhưng chưa có bộ thực thi (SQL, GRAPH). */
  unsupported: string[];
  rationale: string;
}

export interface ChatAnswer {
  status: AnswerStatus;
  answer: string;
  citations: ChatCitation[];
  warnings: string[];
  confidence: "HIGH" | "MEDIUM" | "LOW" | null;
  model: ChatModelInfo | null;
  routing: ChatRouting | null;
  message_id: string;
  conversation_id: string;
  correlation_id: string | null;
}

export interface ConversationSummary {
  conversation_id: string;
  title: string | null;
  max_security_level: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ChatToolCall {
  tool: string;
  result_count: number;
  /** Số kết quả bị loại vì vượt quyền của người hỏi. */
  trimmed_count: number;
  duration_ms: number | null;
}

export interface ConversationMessage {
  message_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  status: AnswerStatus | null;
  confidence: string | null;
  warnings: string[];
  latency_ms: number | null;
  created_at: string | null;
  citations: ChatCitation[];
  tools: ChatToolCall[];
}

export interface ConversationDetail {
  conversation_id: string;
  title: string | null;
  max_security_level: number;
  messages: ConversationMessage[];
}

export const aiChatApi = {
  ask: async (payload: {
    question: string;
    conversation_id?: string;
    model_id?: string;
    top_k?: number;
  }): Promise<ChatAnswer> =>
    (await ingestionClient.post("/api/v1/chat/completions", payload)).data,

  listConversations: async (): Promise<{ total: number; items: ConversationSummary[] }> =>
    (await ingestionClient.get("/api/v1/conversations")).data,

  getConversation: async (id: string): Promise<ConversationDetail> =>
    (await ingestionClient.get(`/api/v1/conversations/${id}`)).data,

  archiveConversation: async (id: string): Promise<void> => {
    await ingestionClient.delete(`/api/v1/conversations/${id}`);
  },

  sendFeedback: async (messageId: string, rating: "UP" | "DOWN", reason?: string) => {
    await ingestionClient.post(`/api/v1/messages/${messageId}/feedback`, {
      rating,
      reason,
    });
  },

  listModels: async (): Promise<{ total: number; items: ChatModelInfo[] }> =>
    (await ingestionClient.get("/api/v1/models")).data,

  setModelApproval: async (
    id: string,
    approvalStatus: "EXPERIMENTAL" | "APPROVED" | "SUSPENDED",
    reason?: string
  ): Promise<ChatModelInfo> =>
    (await ingestionClient.post(`/api/v1/models/${id}/approval`, {
      approval_status: approvalStatus,
      reason,
    })).data,
};

export default aiChatApi;
