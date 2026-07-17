import { useState, useCallback, useEffect } from "react";
import { serverApi } from "../api/serverApi";
import type { SyncConnectionConfig, SyncConnectionConfigRequest } from "../types/server";

interface ActionResult {
  success: boolean;
  error?: string;
}

export function useServers() {
  const [servers, setServers] = useState<SyncConnectionConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await serverApi.getAll();
      setServers(res.data || []);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Lỗi tải danh sách kết nối");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  const createServer = useCallback(
    async (data: SyncConnectionConfigRequest): Promise<ActionResult> => {
      try {
        await serverApi.create(data);
        await fetchServers();
        return { success: true };
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        const msg = e.response?.data?.message || e.message || "Lỗi tạo kết nối";
        return { success: false, error: msg };
      }
    },
    [fetchServers]
  );

  const updateServer = useCallback(
    async (id: string, data: SyncConnectionConfigRequest): Promise<ActionResult> => {
      try {
        await serverApi.update(id, data);
        await fetchServers();
        return { success: true };
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        const msg = e.response?.data?.message || e.message || "Lỗi cập nhật kết nối";
        return { success: false, error: msg };
      }
    },
    [fetchServers]
  );

  const deleteServer = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await serverApi.deleteById(id);
        await fetchServers();
        return { success: true };
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } }; message?: string };
        const msg = e.response?.data?.message || e.message || "Lỗi xoá kết nối";
        return { success: false, error: msg };
      }
    },
    [fetchServers]
  );

  return {
    servers,
    loading,
    error,
    refresh: fetchServers,
    createServer,
    updateServer,
    deleteServer,
  };
}
