import { useState, useCallback } from "react";
import { excelMappingApi } from "../api/excelMappingApi";
import type { ExcelMappingResponse } from "../types/excelMapping";

export function useExcelMapping() {
  const [result, setResult] = useState<ExcelMappingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await excelMappingApi.analyze(file);
      setResult(res);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e.response?.data?.detail || e.message || "Lỗi phân tích Excel");
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, analyze, clear };
}
