import { useState, useCallback, useEffect } from "react";
import { syncApi } from "../api/syncApi";
import type { SyncStatus, SyncConfigRequest } from "../types/sync";

interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

interface UseSyncStatusReturn {
  status: SyncStatus | null;
  loading: boolean;
  error: string | null;
  start: () => Promise<ActionResult>;
  stop: () => Promise<ActionResult>;
  trigger: () => Promise<ActionResult>;
  updateConfig: (config: SyncConfigRequest) => Promise<ActionResult>;
  refresh: () => Promise<void>;
}

export function useSyncStatus(pollInterval = 10000): UseSyncStatusReturn {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await syncApi.getStatus();
      setStatus(data);
      setError(null);
    } catch (err: unknown) {
      const e = err as { message?: string; response?: { data?: { detail?: string } } };
      console.error("Failed to fetch sync status:", err);
      setError(e.response?.data?.detail || e.message || "Lỗi");
    }
  }, []);

  const start = useCallback(async (): Promise<ActionResult> => {
    setLoading(true);
    try {
      await syncApi.start();
      await fetchStatus();
      return { success: true };
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi");
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  const stop = useCallback(async (): Promise<ActionResult> => {
    setLoading(true);
    try {
      await syncApi.stop();
      await fetchStatus();
      return { success: true };
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi");
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  const trigger = useCallback(async (): Promise<ActionResult> => {
    setLoading(true);
    try {
      const data = await syncApi.trigger();
      await fetchStatus();
      return { success: true, data };
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi");
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, [fetchStatus]);

  const updateConfig = useCallback(
    async (config: SyncConfigRequest): Promise<ActionResult> => {
      setLoading(true);
      try {
        const data = await syncApi.updateConfig(config);
        await fetchStatus();
        return { success: true, data };
      } catch (err: unknown) {
        const e = err as { message?: string };
        setError(e.message || "Lỗi");
        return { success: false, error: e.message };
      } finally {
        setLoading(false);
      }
    },
    [fetchStatus]
  );

  useEffect(() => {
    fetchStatus().finally(() => setLoading(false));
  }, [fetchStatus]);

  useEffect(() => {
    if (!pollInterval || !status?.is_running) return;
    const interval = setInterval(() => {
      fetchStatus();
    }, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, status?.is_running, fetchStatus]);

  return {
    status,
    loading,
    error,
    start,
    stop,
    trigger,
    updateConfig,
    refresh: fetchStatus,
  };
}
