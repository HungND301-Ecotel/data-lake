import axiosDataLakeClient from "../../../services/axiosDataLakeClient";
import type { JobStatus, JobListResponse, JobListParams } from "../types/job";

export const jobApi = {
  getJob: async (jobId: string): Promise<JobStatus> => {
    const res = await axiosDataLakeClient.get(`/api/v1/jobs/${jobId}`);
    return res.data;
  },

  listJobs: async (params?: JobListParams): Promise<JobListResponse> => {
    const res = await axiosDataLakeClient.get("/api/v1/jobs", { params });
    return res.data;
  },

  deleteJob: async (jobId: string): Promise<{ message: string; status: string }> => {
    const res = await axiosDataLakeClient.delete(`/api/v1/jobs/${jobId}`);
    return res.data;
  },

  poll: async (
    jobId: string,
    onProgress?: (job: JobStatus) => void,
    intervalMs = 2000,
  ): Promise<JobStatus> => {
    while (true) {
      const job = await jobApi.getJob(jobId);
      onProgress?.(job);
      if (job.status === "completed" || job.status === "failed") return job;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  },
};
