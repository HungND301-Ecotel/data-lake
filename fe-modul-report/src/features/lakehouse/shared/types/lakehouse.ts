export interface RawFile {
  file_id: string;
  filename: string;
  upload_timestamp: string;
  preview_url: string;
  download_url: string;
}

export interface BronzeRecord {
  file_id: string;
  extracted_text: string;
}

export interface SilverRecord {
  file_id: string;
  structured_data_url: string;
  preview_data: { field: string; value: string }[];
}

export interface PipelineUploadResponse {
  raw: RawFile;
  bronze: BronzeRecord;
  silver: SilverRecord;
}

export interface RawListResponse {
  total: number;
  files: RawFile[];
}

export interface BronzeListResponse {
  total: number;
  records: BronzeRecord[];
}

export interface SilverListResponse {
  total: number;
  records: SilverRecord[];
}

export interface AsyncJobResponse {
  job_id: string;
  status: string;
  message: string;
  poll_url: string;
}

export interface LakehouseChart {
  chart_type: string;
  chart_url: string;
  chart_data: Record<string, unknown>;
  title: string;
}
