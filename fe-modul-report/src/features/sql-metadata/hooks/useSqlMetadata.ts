import { useState, useCallback } from "react";
import { sqlMetadataApi } from "../api/sqlMetadataApi";
import { jobApi } from "../../jobs/api/jobApi";
import type {
  AnalyzeSchemaRequest,
  AnalyzeSchemaResponse,
  AsyncAnalyzeResponse,
  SqlMetadata,
} from "../types/sqlMetadata";

function isAsyncResponse(
  res: AnalyzeSchemaResponse | AsyncAnalyzeResponse
): res is AsyncAnalyzeResponse {
  return "job_id" in res;
}

export function useSqlMetadata() {
  const [metadata, setMetadata] = useState<SqlMetadata | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeSchema = useCallback(
    async (data: AnalyzeSchemaRequest, asyncMode = true) => {
      setLoading(true);
      setError(null);
      setProgress(0);
      setStage(null);
      setMetadata(null);

      try {
        const res = await sqlMetadataApi.analyzeSchema(data, asyncMode);

        if (isAsyncResponse(res)) {
          const finalJob = await jobApi.poll(res.job_id, (job) => {
            setProgress(job.percentage);
            setStage(job.current_stage);
          });

          if (finalJob.status === "failed") {
            setError(finalJob.fatal_error || "Phân tích thất bại");
            return;
          }

          const aid = finalJob.result?.analysis_id as string | undefined;
          if (aid) {
            const meta = await sqlMetadataApi.getMetadata(aid);
            setAnalysisId(aid);
            setMetadata(meta);
          }
        } else {
          setAnalysisId(res.analysis_id);
          setMetadata(res.metadata);
        }
      } catch (err: unknown) {
        const e = err as {
          response?: { data?: { detail?: string } };
          message?: string;
        };
        setError(e.response?.data?.detail || e.message || "Lỗi phân tích schema");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const loadMetadata = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const meta = await sqlMetadataApi.getMetadata(id);
      setAnalysisId(id);
      setMetadata(meta);
    } catch (err: unknown) {
      const e = err as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      setError(e.response?.data?.detail || e.message || "Lỗi tải metadata");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    metadata,
    analysisId,
    loading,
    progress,
    stage,
    error,
    analyzeSchema,
    loadMetadata,
  };
}
