import { useState, useCallback } from "react";
import { tableQaApi } from "../api/tableQaApi";
import type { TableQaResponse } from "../types/tableQa";

export function useTableQa() {
  const [result, setResult] = useState<TableQaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askQuestion = useCallback(async (file: File, query: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await tableQaApi.chat(file, query);
      setResult(res);
      return { success: true, data: res };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg = e.response?.data?.detail || e.message || "Lỗi Table QA";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, askQuestion, clear };
}
