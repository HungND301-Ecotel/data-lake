import { useState, useCallback, useEffect } from "react";
import { goldApi } from "../api/goldApi";
import type { GoldRecord, GoldPrompt, GoldExtractRequest, GoldPromptCreateRequest } from "../types/gold";

export function useGold() {
  const [records, setRecords] = useState<GoldRecord[]>([]);
  const [prompts, setPrompts] = useState<GoldPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await goldApi.list();
      setRecords(res.records);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e.response?.data?.detail || e.message || "Lỗi tải gold records");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPrompts = useCallback(async () => {
    try {
      const res = await goldApi.listPrompts();
      setPrompts(res);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchPrompts();
  }, [fetchRecords, fetchPrompts]);

  const extract = useCallback(async (data: GoldExtractRequest) => {
    try {
      const res = await goldApi.extract(data);
      await fetchRecords();
      return { success: true, data: res };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      return { success: false, error: e.response?.data?.detail || e.message || "Lỗi trích xuất gold" };
    }
  }, [fetchRecords]);

  const confirm = useCallback(async (goldId: string) => {
    try {
      await goldApi.confirm(goldId);
      await fetchRecords();
      return { success: true };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      return { success: false, error: e.response?.data?.detail || e.message || "Lỗi xác nhận" };
    }
  }, [fetchRecords]);

  const savePrompt = useCallback(async (data: GoldPromptCreateRequest) => {
    try {
      await goldApi.savePrompt(data);
      await fetchPrompts();
      return { success: true };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      return { success: false, error: e.response?.data?.detail || e.message || "Lỗi lưu prompt" };
    }
  }, [fetchPrompts]);

  return {
    records, prompts, loading, error,
    extract, confirm, savePrompt,
    refresh: fetchRecords,
    getDownloadUrl: goldApi.getDownloadUrl,
  };
}
