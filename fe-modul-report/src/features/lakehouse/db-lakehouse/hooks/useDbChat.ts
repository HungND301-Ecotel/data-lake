import { useState, useCallback, useRef } from "react";
import { dbLakehouseApi } from "../api/dbLakehouseApi";
import type {
  ChatResponse,
  ChartResponse,
  ChatHistoryMessage,
  PlotlyChart,
  ChatSSEEvent,
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
  streaming?: boolean;
  status?: string;
}

export function useDbChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamingRef = useRef(false);

  const updateLastAssistant = useCallback((updater: (msg: ChatMessage) => ChatMessage) => {
    setMessages((prev) => {
      const idx = prev.length - 1;
      if (idx < 0 || prev[idx].role !== "assistant") return prev;
      const updated = [...prev];
      updated[idx] = updater(updated[idx]);
      return updated;
    });
  }, []);

  const sendMessageStream = useCallback(async (question: string, database: string, generateChart = true) => {
    setSending(true);
    setError(null);
    streamingRef.current = true;

    const userMsg: ChatMessage = {
      role: "user",
      content: question,
      timestamp: new Date().toISOString(),
    };
    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
      streaming: true,
      status: "Đang xử lý...",
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    try {
      await dbLakehouseApi.chatStream(
        {
          question,
          database,
          session_id: sessionId || undefined,
          generate_chart: generateChart,
        },
        (evt: ChatSSEEvent) => {
          switch (evt.event) {
            case "start":
              if (evt.session_id) setSessionId(evt.session_id);
              updateLastAssistant((m) => ({ ...m, status: "Đang tải schema..." }));
              break;

            case "schema_loaded":
              updateLastAssistant((m) => ({ ...m, status: evt.message || `Đã tải ${evt.tables_count} bảng` }));
              break;

            case "sql_generating":
              updateLastAssistant((m) => ({ ...m, status: evt.message || "Đang sinh SQL..." }));
              break;

            case "sql_generated":
            case "sql_fixed":
              updateLastAssistant((m) => ({ ...m, sqlQuery: evt.sql_query, status: "Đang thực thi SQL..." }));
              break;

            case "query_executing":
              updateLastAssistant((m) => ({ ...m, status: evt.message || "Đang truy vấn..." }));
              break;

            case "query_result":
              updateLastAssistant((m) => ({
                ...m,
                columns: evt.columns,
                totalRows: evt.total_rows,
                status: `Có ${evt.total_rows} dòng kết quả, đang sinh câu trả lời...`,
              }));
              break;

            case "answer_streaming":
              updateLastAssistant((m) => ({ ...m, status: "Đang trả lời..." }));
              break;

            case "answer_token":
              updateLastAssistant((m) => ({ ...m, content: m.content + (evt.token || "") }));
              break;

            case "answer_done":
              updateLastAssistant((m) => ({ ...m, content: evt.answer || m.content }));
              break;

            case "data":
              updateLastAssistant((m) => ({
                ...m,
                data: evt.data,
                columns: evt.columns || m.columns,
                totalRows: evt.total_rows ?? m.totalRows,
                sqlQuery: evt.sql_query || m.sqlQuery,
              }));
              break;

            case "chart":
              updateLastAssistant((m) => ({ ...m, chart: evt.chart }));
              break;

            case "complete":
              updateLastAssistant((m) => ({ ...m, streaming: false, status: undefined }));
              break;

            case "error":
              updateLastAssistant((m) => ({
                ...m,
                content: m.content || evt.message || "Có lỗi xảy ra",
                streaming: false,
                status: undefined,
              }));
              setError(evt.message || "Lỗi xử lý");
              break;
          }
        },
      );
    } catch (err: unknown) {
      const e = err as { message?: string };
      const msg = e.message || "Lỗi kết nối stream";
      setError(msg);
      updateLastAssistant((m) => ({
        ...m,
        content: m.content || msg,
        streaming: false,
        status: undefined,
      }));
    } finally {
      setSending(false);
      streamingRef.current = false;
    }
  }, [sessionId, updateLastAssistant]);

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
        chart_type: chartType as "bar" | "line" | "pie" | "scatter" | "heatmap" | undefined,
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
    sendMessageStream,
    requestChart,
    loadHistory,
    clearChat,
  };
}
