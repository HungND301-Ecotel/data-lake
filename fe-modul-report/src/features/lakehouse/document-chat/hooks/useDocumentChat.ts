import { useState, useCallback } from "react";
import { documentChatApi } from "../api/documentChatApi";
import type { DocChatMessage } from "../types/documentChat";

export function useDocumentChat() {
  const [messages, setMessages] = useState<DocChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentName, setDocumentName] = useState<string | null>(null);

  const sendMessage = useCallback(async (query: string, file?: File) => {
    const userMsg: DocChatMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    if (file) setDocumentName(file.name);

    try {
      const res = await documentChatApi.chat(query, { sessionId: sessionId || undefined, file });
      setSessionId(res.session_id);
      const aiMsg: DocChatMessage = {
        role: "assistant",
        content: res.answer,
        chart: res.chart,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e.response?.data?.detail || e.message || "Lỗi Document Chat");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const resetSession = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setDocumentName(null);
    setError(null);
  }, []);

  return { messages, sessionId, documentName, loading, error, sendMessage, resetSession };
}
