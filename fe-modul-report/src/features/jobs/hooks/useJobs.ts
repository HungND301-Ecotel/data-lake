import { useState, useCallback, useEffect } from "react";
import { jobApi } from "../api/jobApi";
import type { JobStatus, JobListParams } from "../types/job";

export function useJobs(autoRefreshMs = 5000) {
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobListParams>({});

  const fetchJobs = useCallback(async (params?: JobListParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await jobApi.listJobs(params || filters);
      setJobs(res.jobs);
      setTotal(res.total);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e.response?.data?.detail || e.message || "Lỗi tải danh sách jobs");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => fetchJobs(), autoRefreshMs);
    return () => clearInterval(interval);
  }, [fetchJobs, autoRefreshMs]);

  const deleteJob = useCallback(async (jobId: string) => {
    try {
      await jobApi.deleteJob(jobId);
      await fetchJobs();
      return { success: true };
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      return { success: false, error: e.response?.data?.detail || e.message || "Lỗi xoá job" };
    }
  }, [fetchJobs]);

  const updateFilters = useCallback((newFilters: JobListParams) => {
    setFilters(newFilters);
  }, []);

  return {
    jobs,
    total,
    loading,
    error,
    filters,
    setFilters: updateFilters,
    deleteJob,
    refresh: fetchJobs,
  };
}
