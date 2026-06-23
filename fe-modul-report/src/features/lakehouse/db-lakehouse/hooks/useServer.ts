import { useState, useCallback, useEffect } from "react";
import { serverApi } from "../api/serverApi";
import type { ServerConfig, ServerCreateRequest, ServerUpdateRequest, ServerTestResponse } from "../types/dbLakehouse";

export function useServer() {
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serverApi.list();
      setServers(res.servers || []);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi tải danh sách server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const createServer = useCallback(async (body: ServerCreateRequest) => {
    setSaving(true);
    setError(null);
    try {
      const res = await serverApi.create(body);
      await fetchServers();
      return { success: true, data: res };
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi tạo server");
      return { success: false, error: e.message };
    } finally {
      setSaving(false);
    }
  }, [fetchServers]);

  const updateServer = useCallback(async (serverId: string, body: ServerUpdateRequest) => {
    setSaving(true);
    setError(null);
    try {
      const res = await serverApi.update(serverId, body);
      await fetchServers();
      return { success: true, data: res };
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi cập nhật server");
      return { success: false, error: e.message };
    } finally {
      setSaving(false);
    }
  }, [fetchServers]);

  const deleteServer = useCallback(async (serverId: string) => {
    setError(null);
    try {
      await serverApi.delete(serverId);
      await fetchServers();
      return { success: true };
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi xoá server");
      return { success: false, error: e.message };
    }
  }, [fetchServers]);

  const testConnection = useCallback(async (serverId: string): Promise<{ success: boolean; data?: ServerTestResponse; error?: string }> => {
    setTesting(true);
    setError(null);
    try {
      const res = await serverApi.test(serverId);
      return { success: true, data: res };
    } catch (err: unknown) {
      const e = err as { message?: string };
      return { success: false, error: e.message };
    } finally {
      setTesting(false);
    }
  }, []);

  const setDefault = useCallback(async (serverId: string) => {
    setError(null);
    try {
      await serverApi.setDefault(serverId);
      await fetchServers();
      return { success: true };
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi đặt server mặc định");
      return { success: false, error: e.message };
    }
  }, [fetchServers]);

  const defaultServer = servers.find((s) => s.is_default) || null;

  return {
    servers,
    defaultServer,
    loading,
    saving,
    testing,
    error,
    fetchServers,
    createServer,
    updateServer,
    deleteServer,
    testConnection,
    setDefault,
  };
}
