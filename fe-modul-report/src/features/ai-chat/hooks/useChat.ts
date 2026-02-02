import { useState, useCallback, useEffect } from "react";
import { chatApi } from "../api/chatApi";
import type { ChatMessage, ChatSession } from "../types/chat";

interface UseChatReturn {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sessionId: string | null;
  sessions: ChatSession[];
  sessionsLoading: boolean;
  sendMessage: (message: string) => Promise<unknown>;
  clearHistory: () => Promise<void>;
  search: (query: string, k?: number) => Promise<unknown>;
  loadHistory: (sid: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  switchSession: (newSessionId: string) => void;
  startNewChat: () => void;
  deleteSession: (sid: string) => Promise<void>;
}

export function useChat(initialSessionId: string | null = null): UseChatReturn {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const response = await chatApi.getSessions();
      setSessions(response.sessions || []);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (sid: string) => {
    if (!sid) return;
    setLoading(true);
    try {
      const response = await chatApi.getHistory(sid);
      const history = response.messages || [];
      setMessages(
        history.map((msg, index) => ({
          id: `history-${index}`,
          role: msg.role as ChatMessage["role"],
          content: msg.content,
        }))
      );
    } catch (err) {
      console.error("Failed to load chat history:", err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const switchSession = useCallback((newSessionId: string) => {
    setSessionId(newSessionId);
    setError(null);
  }, []);

  const startNewChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return null;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "human",
        content: message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      try {
        const data = await chatApi.send(message, sessionId);

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: "ai",
          content: data.answer,
          timestamp: data.timestamp,
          sources: data.sources,
          chart: data.chart,
          data: data.data,
        };

        setMessages((prev) => [...prev, aiMessage]);

        if (!sessionId && data.session_id) {
          setSessionId(data.session_id);
        }

        loadSessions();
        return data;
      } catch (err: unknown) {
        const error = err as { message?: string; response?: { data?: { detail?: string } } };
        const errorMessage =
          error.response?.data?.detail || error.message || "Đã xảy ra lỗi";
        setError(errorMessage);

        const errorResponse: ChatMessage = {
          id: `error-${Date.now()}`,
          role: "ai",
          content: `Xin lỗi, đã xảy ra lỗi: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, errorResponse]);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [sessionId, loadSessions]
  );

  const clearHistory = useCallback(async () => {
    if (!sessionId) return;
    try {
      await chatApi.clearHistory(sessionId);
      setMessages([]);
      setError(null);
      loadSessions();
    } catch (err) {
      console.error("Failed to clear history:", err);
      setError("Không thể xóa lịch sử chat");
    }
  }, [sessionId, loadSessions]);

  const deleteSession = useCallback(
    async (sid: string) => {
      try {
        await chatApi.clearHistory(sid);
        if (sid === sessionId) {
          startNewChat();
        }
        loadSessions();
      } catch (err) {
        console.error("Failed to delete session:", err);
      }
    },
    [sessionId, startNewChat, loadSessions]
  );

  const search = useCallback(async (query: string, k: number = 5) => {
    try {
      return await chatApi.search(query, k);
    } catch (err) {
      console.error("Search failed:", err);
      return null;
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (sessionId) {
      loadHistory(sessionId);
    }
  }, [sessionId]);

  return {
    messages,
    loading,
    error,
    sessionId,
    sessions,
    sessionsLoading,
    sendMessage,
    clearHistory,
    search,
    loadHistory,
    loadSessions,
    switchSession,
    startNewChat,
    deleteSession,
  };
}
