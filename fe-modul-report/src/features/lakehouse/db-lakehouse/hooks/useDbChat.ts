import { useState, useCallback } from "react";
import { dbLakehouseApi } from "../api/dbLakehouseApi";
import type {
  ChatResponse,
  ChartResponse,
  ChatHistoryMessage,
  PlotlyChart,
} from "../types/dbLakehouse";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sqlQuery?: string | null;
  data?: Record<string, unknown>[] | null;
  columns?: string[] | null;
  totalRows?: number | null;
  chart?: PlotlyChart | null;
  timestamp: string;
}

export function useDbChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (question: string, database: string, generateChart = true) => {
    setSending(true);
    setError(null);

    const userMsg: ChatMessage = {
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res: ChatResponse = await dbLakehouseApi.chat({
        question,
        database,
        session_id: sessionId || undefined,
        generate_chart: generateChart,
      });

      if (res.session_id) setSessionId(res.session_id);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: res.answer,
        sqlQuery: res.sql_query,
        data: res.data,
        columns: res.columns,
        totalRows: res.total_rows,
        chart: res.chart,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      return { success: true, data: res };
    } catch (err: unknown) {
      const e = err as { message?: string };
      const msg = e.message || "Lỗi gửi câu hỏi";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSending(false);
    }
  }, [sessionId]);

  const requestChart = useCallback(async (database: string, question: string, chartType?: string) => {
    setSending(true);
    setError(null);
    try {
      const res: ChartResponse = await dbLakehouseApi.chart({
        database,
        question,
        chart_type: chartType as ChartResponse["chart_type"],
      });
      return { success: true, data: res };
    } catch (err: unknown) {
      const e = err as { message?: string };
      const msg = e.message || "Lỗi tạo biểu đồ";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSending(false);
    }
  }, []);

  const loadHistory = useCallback(async (sid: string) => {
    setError(null);
    try {
      const res = await dbLakehouseApi.getChatHistory(sid);
      setSessionId(sid);
      const historyMessages: ChatMessage[] = [];
      res.messages.forEach((m: ChatHistoryMessage) => {
        historyMessages.push({ role: "user", content: m.question, timestamp: m.timestamp });
        historyMessages.push({ role: "assistant", content: m.answer, timestamp: m.timestamp });
      });
      setMessages(historyMessages);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi tải lịch sử chat");
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
  }, []);

  return {
    messages,
    sessionId,
    sending,
    error,
    sendMessage,
    requestChart,
    loadHistory,
    clearChat,
  };
}
