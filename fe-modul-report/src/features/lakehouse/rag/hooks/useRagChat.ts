import { useState, useCallback } from "react";
import { ragApi } from "../api/ragApi";
import type { RagMessage, RagSearchResponse } from "../types/rag";

export function useRagChat() {
  const [messages, setMessages] = useState<RagMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (query: string) => {
    const userMsg: RagMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setError(null);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await ragApi.chat({ query, history });
      const aiMsg: RagMessage = {
        role: "assistant",
        content: res.answer,
        sources: res.sources,
        chart: res.chart,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e.response?.data?.detail || e.message || "Lỗi chat RAG");
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearMessages };
}

export function useRagSearch() {
  const [results, setResults] = useState<RagSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string, topK = 5) => {
    setLoading(true);
    try {
      const res = await ragApi.search({ query, top_k: topK });
      setResults(res);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search };
}

export function useRagIngest() {
  const [loading, setLoading] = useState(false);

  const ingest = useCallback(async (fileIds: string[]) => {
    setLoading(true);
    try {
      const res = await ragApi.ingest({ file_ids: fileIds });
      return { success: true, data: res };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      return { success: false, error: e.response?.data?.detail || e.message || "Lỗi ingest" };
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, ingest };
}
