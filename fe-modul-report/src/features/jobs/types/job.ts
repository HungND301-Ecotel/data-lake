export type JobStatusType = "pending" | "running" | "completed" | "failed";

export interface JobError {
  item: string;
  error: string;
  timestamp: string;
}

export interface JobErrorData {
  row_index: number | null;
  data: Record<string, unknown>;
  error: string;
}

export interface JobStatus {
  job_id: string;
  job_type: string;
  status: JobStatusType;
  percentage: number;
  current_stage: string | null;
  stages_completed: number;
  total_stages: number;
  errors: JobError[];
  error_data: JobErrorData[];
  result: Record<string, unknown> | null;
  fatal_error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface JobListResponse {
  jobs: JobStatus[];
  total: number;
}

export interface JobListParams {
  status?: JobStatusType;
  type?: string;
}
