import { useState, useCallback, useEffect } from "react";
import { dbLakehouseApi } from "../api/dbLakehouseApi";
import type {
  DatabaseMeta,
  DatabaseInfoResponse,
  BronzeUploadResponse,
  SilverTransformRequest,
  SilverTransformResponse,
  GoldTransformRequest,
  GoldTransformResponse,
  PipelineResponse,
} from "../types/dbLakehouse";

export type DbLayerType = "bronze" | "silver" | "gold";

export function useDbPipeline() {
  const [databases, setDatabases] = useState<Record<string, DatabaseMeta>>({});
  const [selectedDb, setSelectedDb] = useState<DatabaseInfoResponse | null>(null);
  const [activeLayer, setActiveLayer] = useState<DbLayerType>("bronze");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transforming, setTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDatabases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dbLakehouseApi.listDatabases();
      setDatabases(res.databases || {});
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi tải danh sách database");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDatabases();
  }, [fetchDatabases]);

  const viewDatabase = useCallback(async (dbName: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await dbLakehouseApi.getDatabase(dbName);
      setSelectedDb(res);
      return { success: true, data: res };
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi tải thông tin database");
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadBronze = useCallback(async (file: File, databaseName?: string) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const res = await dbLakehouseApi.bronzeUpload(file, undefined, databaseName, setUploadProgress);
      await fetchDatabases();
      return { success: true, data: res } as { success: true; data: BronzeUploadResponse };
    } catch (err: unknown) {
      const e = err as { message?: string };
      const msg = e.message || "Lỗi upload file .bak";
      setError(msg);
      return { success: false, error: msg } as { success: false; error: string };
    } finally {
      setUploading(false);
    }
  }, [fetchDatabases]);

  const uploadFullPipeline = useCallback(async (file: File, options?: { autoClean?: boolean; autoStandardize?: boolean }) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const res = await dbLakehouseApi.pipelineUpload(file, options, setUploadProgress);
      await fetchDatabases();
      return { success: true, data: res } as { success: true; data: PipelineResponse };
    } catch (err: unknown) {
      const e = err as { message?: string };
      const msg = e.message || "Lỗi chạy full pipeline";
      setError(msg);
      return { success: false, error: msg } as { success: false; error: string };
    } finally {
      setUploading(false);
    }
  }, [fetchDatabases]);

  const transformSilver = useCallback(async (body: SilverTransformRequest) => {
    setTransforming(true);
    setError(null);
    try {
      const res = await dbLakehouseApi.silverTransform(body);
      await fetchDatabases();
      return { success: true, data: res } as { success: true; data: SilverTransformResponse };
    } catch (err: unknown) {
      const e = err as { message?: string };
      const msg = e.message || "Lỗi transform Silver";
      setError(msg);
      return { success: false, error: msg } as { success: false; error: string };
    } finally {
      setTransforming(false);
    }
  }, [fetchDatabases]);

  const transformGold = useCallback(async (body: GoldTransformRequest) => {
    setTransforming(true);
    setError(null);
    try {
      const res = await dbLakehouseApi.goldTransform(body);
      await fetchDatabases();
      return { success: true, data: res } as { success: true; data: GoldTransformResponse };
    } catch (err: unknown) {
      const e = err as { message?: string };
      const msg = e.message || "Lỗi transform Gold";
      setError(msg);
      return { success: false, error: msg } as { success: false; error: string };
    } finally {
      setTransforming(false);
    }
  }, [fetchDatabases]);

  const databasesByLayer = useCallback((layer: DbLayerType) => {
    return Object.values(databases || {}).filter((db) => db.layer === layer);
  }, [databases]);

  return {
    databases,
    selectedDb,
    setSelectedDb,
    activeLayer,
    setActiveLayer,
    loading,
    uploading,
    uploadProgress,
    transforming,
    error,
    fetchDatabases,
    viewDatabase,
    uploadBronze,
    uploadFullPipeline,
    transformSilver,
    transformGold,
    databasesByLayer,
  };
}
