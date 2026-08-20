import { useState, useCallback, useEffect } from "react";
import { dbLakehouseApi } from "../api/dbLakehouseApi";
import type {
  ValueMappingListItem,
  ValueMappingConfig,
  ValueMappingSaveRequest,
  ValueMappingApplyRequest,
  ValueMappingApplyResponse,
  SSEEvent,
  StreamLog,
} from "../types/dbLakehouse";

export function useValueMapping() {
  const [mappings, setMappings] = useState<ValueMappingListItem[]>([]);
  const [selectedMapping, setSelectedMapping] = useState<ValueMappingConfig | null>(null);
  const [applyResult, setApplyResult] = useState<ValueMappingApplyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SSE apply stream state
  const [streamProgress, setStreamProgress] = useState(0);
  const [streamLogs, setStreamLogs] = useState<StreamLog[]>([]);
  const [streamMessage, setStreamMessage] = useState("");

  const fetchMappings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dbLakehouseApi.mappingList();
      setMappings(res.mappings || []);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi tải danh sách mapping");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMappings();
  }, [fetchMappings]);

  const getMapping = useCallback(async (name: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await dbLakehouseApi.mappingGet(name);
      setSelectedMapping(res);
      return { success: true, data: res };
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi tải mapping");
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const saveMapping = useCallback(async (body: ValueMappingSaveRequest) => {
    setSaving(true);
    setError(null);
    try {
      const res = await dbLakehouseApi.mappingSave(body);
      await fetchMappings();
      return { success: true, data: res };
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi lưu mapping");
      return { success: false, error: e.message };
    } finally {
      setSaving(false);
    }
  }, [fetchMappings]);

  const deleteMapping = useCallback(async (name: string) => {
    setError(null);
    try {
      await dbLakehouseApi.mappingDelete(name);
      await fetchMappings();
      if (selectedMapping?.name === name) setSelectedMapping(null);
      return { success: true };
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi xoá mapping");
      return { success: false, error: e.message };
    }
  }, [fetchMappings, selectedMapping]);

  const applyMapping = useCallback(async (body: ValueMappingApplyRequest) => {
    setApplying(true);
    setError(null);
    setApplyResult(null);
    try {
      const res = await dbLakehouseApi.mappingApply(body);
      setApplyResult(res);
      return { success: true, data: res };
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi áp dụng mapping");
      return { success: false, error: e.message };
    } finally {
      setApplying(false);
    }
  }, []);

  const applyMappingStream = useCallback(async (body: ValueMappingApplyRequest) => {
    setApplying(true);
    setError(null);
    setApplyResult(null);
    setStreamProgress(0);
    setStreamLogs([]);
    setStreamMessage("");
    try {
      await dbLakehouseApi.mappingApplyStream(body, (evt: SSEEvent) => {
        const prog = evt.progress ?? 0;
        setStreamProgress(prog);
        if (evt.message) setStreamMessage(evt.message);

        const log: StreamLog = {
          event: evt.event,
          message: evt.message || `${evt.event}${evt.table ? ` - ${evt.table}` : ""}`,
          progress: prog,
          phase: evt.event === "complete" ? "complete" : evt.event === "error" ? "error" : "gold",
          timestamp: new Date().toISOString(),
          data: evt,
        };
        setStreamLogs((prev) => [...prev, log]);

        if (evt.event === "error") {
          setError(evt.message || "Lỗi áp dụng mapping");
        }
      });
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi stream mapping");
    } finally {
      setApplying(false);
    }
  }, []);

  return {
    mappings,
    selectedMapping,
    applyResult,
    loading,
    saving,
    applying,
    error,
    streamProgress,
    streamLogs,
    streamMessage,
    fetchMappings,
    getMapping,
    saveMapping,
    deleteMapping,
    applyMapping,
    applyMappingStream,
  };
}
