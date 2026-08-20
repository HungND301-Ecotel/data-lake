import { useState, useCallback, useEffect } from "react";
import { pipelineApi } from "../api/pipelineApi";
import type { RawFile, BronzeRecord, SilverRecord, AsyncJobResponse } from "../../shared/types/lakehouse";

export type LayerType = "raw" | "bronze" | "silver";

export function usePipeline() {
  const [rawFiles, setRawFiles] = useState<RawFile[]>([]);
  const [bronzeRecords, setBronzeRecords] = useState<BronzeRecord[]>([]);
  const [silverRecords, setSilverRecords] = useState<SilverRecord[]>([]);
  const [activeLayer, setActiveLayer] = useState<LayerType>("raw");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rawRes, bronzeRes, silverRes] = await Promise.all([
        pipelineApi.listRaw(),
        pipelineApi.listBronze(),
        pipelineApi.listSilver(),
      ]);
      setRawFiles(rawRes.files);
      setBronzeRecords(bronzeRes.records);
      setSilverRecords(silverRes.records);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e.response?.data?.detail || e.message || "Lỗi tải dữ liệu pipeline");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const upload = useCallback(async (file: File, asyncMode = true) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const res = await pipelineApi.upload(file, asyncMode, setUploadProgress);
      await fetchAll();
      return { success: true, data: res };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      const msg = e.response?.data?.detail || e.message || "Lỗi upload file";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setUploading(false);
    }
  }, [fetchAll]);

  const isAsyncResponse = (data: unknown): data is AsyncJobResponse => {
    return data !== null && typeof data === "object" && "job_id" in (data as Record<string, unknown>);
  };

  return {
    rawFiles,
    bronzeRecords,
    silverRecords,
    activeLayer,
    setActiveLayer,
    loading,
    uploading,
    uploadProgress,
    error,
    upload,
    refresh: fetchAll,
    isAsyncResponse,
    getPreviewUrl: pipelineApi.getPreviewUrl,
    getDownloadUrl: pipelineApi.getDownloadUrl,
    getSilverDownloadUrl: pipelineApi.getSilverDownloadUrl,
  };
}
