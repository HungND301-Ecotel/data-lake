export type DatabaseType = 'POSTGRESQL' | 'MYSQL' | 'SQLSERVER' | 'ORACLE';

export interface SyncConnectionConfig {
  id: string;
  name?: string;
  host: string;
  databaseName: string;
  port: number;
  username: string;
  timeoutSeconds?: number;
  active?: boolean;
  is_default?: boolean;
  databaseType: DatabaseType;
}

export interface SyncConnectionConfigRequest {
  name?: string;
  host: string;
  databaseName: string;
  port: number;
  username: string;
  password: string;
  timeoutSeconds?: number;
  active?: boolean;
  is_default?: boolean;
  databaseType: DatabaseType;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  databases: string[];
}
