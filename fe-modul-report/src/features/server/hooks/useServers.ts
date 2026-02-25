import { useState, useCallback, useEffect } from "react";
import { serverApi } from "../api/serverApi";
import type {
  ServerConfig,
  ServerCreateRequest,
  ServerUpdateRequest,
  TestConnectionResult,
} from "../types/server";

interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export function useServers() {
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serverApi.getAll();
      setServers(res.servers);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e.response?.data?.detail || e.message || "Lỗi tải danh sách server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const createServer = useCallback(async (data: ServerCreateRequest): Promise<ActionResult> => {
    try {
      await serverApi.create(data);
      await fetchServers();
      return { success: true };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg = e.response?.data?.detail || e.message || "Lỗi tạo server";
      return { success: false, error: msg };
    }
  }, [fetchServers]);

  const updateServer = useCallback(async (serverId: string, data: ServerUpdateRequest): Promise<ActionResult> => {
    try {
      await serverApi.update(serverId, data);
      await fetchServers();
      return { success: true };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg = e.response?.data?.detail || e.message || "Lỗi cập nhật server";
      return { success: false, error: msg };
    }
  }, [fetchServers]);

  const deleteServer = useCallback(async (serverId: string): Promise<ActionResult> => {
    try {
      await serverApi.delete(serverId);
      await fetchServers();
      return { success: true };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg = e.response?.data?.detail || e.message || "Lỗi xoá server";
      return { success: false, error: msg };
    }
  }, [fetchServers]);

  const testConnection = useCallback(async (serverId: string): Promise<TestConnectionResult> => {
    const res = await serverApi.testConnection(serverId);
    return res;
  }, []);

  const setDefault = useCallback(async (serverId: string): Promise<ActionResult> => {
    try {
      await serverApi.setDefault(serverId);
      await fetchServers();
      return { success: true };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg = e.response?.data?.detail || e.message || "Lỗi đặt server mặc định";
      return { success: false, error: msg };
    }
  }, [fetchServers]);

  const getDatabases = useCallback(async (serverId: string): Promise<string[]> => {
    return await serverApi.getDatabases(serverId);
  }, []);

  return {
    servers,
    loading,
    error,
    refresh: fetchServers,
    createServer,
    updateServer,
    deleteServer,
    testConnection,
    setDefault,
    getDatabases,
  };
}
