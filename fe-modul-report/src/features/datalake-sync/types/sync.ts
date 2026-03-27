export interface SyncStatus {
  is_running: boolean;
  database?: string;
  interval_minutes?: number;
  tables_monitored?: string[];
  timestamp_column?: string;
  sync_count?: number;
  records_synced_total?: number;
  last_sync?: string;
  next_sync?: string;
  recent_errors?: string[];
  tables?: string[];
}

export interface SyncConfigRequest {
  interval_minutes: number;
  database: string;
  tables: string[] | null;
  timestamp_column: string;
}
