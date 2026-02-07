import { useState, useCallback, useEffect } from "react";
import { dataApi } from "../api/datalakeApi";
import type { DataStatus, DataSource } from "../types/datalake";

interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

interface UseDataStatusReturn {
  status: DataStatus | null;
  sources: DataSource[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  reindex: () => Promise<ActionResult>;
  loadData: () => Promise<ActionResult>;
  importLive: (
    database: string,
    tables?: string[] | null,
    rowLimit?: number
  ) => Promise<ActionResult>;
}

export function useDataStatus(pollInterval = 60000): UseDataStatusReturn {
  const [status, setStatus] = useState<DataStatus | null>(null);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await dataApi.getStatus();
      setStatus(data);
      setError(null);
    } catch (err: unknown) {
      const e = err as { message?: string; response?: { data?: { detail?: string } } };
      console.error("Failed to fetch data status:", err);
      setError(e.response?.data?.detail || e.message || "Lỗi");
    }
  }, []);

  const fetchSources = useCallback(async () => {
    try {
      const data = await dataApi.getSources();
      setSources(data);
    } catch (err) {
      console.error("Failed to fetch data sources:", err);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchStatus(), fetchSources()]);
    setLoading(false);
  }, [fetchStatus, fetchSources]);

  const reindex = useCallback(async (): Promise<ActionResult> => {
    setLoading(true);
    try {
      await dataApi.reindex();
      await refresh();
      return { success: true };
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi");
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const loadData = useCallback(async (): Promise<ActionResult> => {
    setLoading(true);
    try {
      await dataApi.load();
      await refresh();
      return { success: true };
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi");
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const importLive = useCallback(
    async (
      database: string,
      tables?: string[] | null,
      rowLimit?: number
    ): Promise<ActionResult> => {
      setLoading(true);
      try {
        const data = await dataApi.importLive(database, tables ?? null, rowLimit);
        await refresh();
        return { success: true, data };
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e.message || "Lỗi");
        return { success: false, error: e.message };
      } finally {
        setLoading(false);
      }
    },
    [refresh]
  );

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!pollInterval) return;
    const interval = setInterval(() => {
      fetchStatus();
    }, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, fetchStatus]);

  return {
    status,
    sources,
    loading,
    error,
    refresh,
    reindex,
    loadData,
    importLive,
  };
}
