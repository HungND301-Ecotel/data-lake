import { useState, useCallback, useRef, useEffect } from "react";
import { jobApi } from "../api/jobApi";
import type { JobStatus } from "../types/job";

export function useJobPoller(pollIntervalMs = 2000) {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const jobIdRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    jobIdRef.current = null;
    setLoading(false);
  }, []);

  const pollOnce = useCallback(async (jobId: string) => {
    try {
      const status = await jobApi.getJob(jobId);
      setJob(status);
      if (status.status === "completed" || status.status === "failed") {
        stopPolling();
      }
      return status;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e.response?.data?.detail || e.message || "Lỗi polling job");
      stopPolling();
      return null;
    }
  }, [stopPolling]);

  const startPolling = useCallback((jobId: string) => {
    stopPolling();
    jobIdRef.current = jobId;
    setLoading(true);
    setError(null);
    setJob(null);

    // Poll immediately
    pollOnce(jobId);

    // Then poll at interval
    intervalRef.current = setInterval(() => {
      if (jobIdRef.current) {
        pollOnce(jobIdRef.current);
      }
    }, pollIntervalMs);
  }, [pollOnce, pollIntervalMs, stopPolling]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { job, loading, error, startPolling, stopPolling };
}
