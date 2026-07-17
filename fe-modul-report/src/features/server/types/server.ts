export type DatabaseType = 'POSTGRESQL' | 'MYSQL' | 'SQLSERVER' | 'ORACLE';

export interface SyncConnectionConfig {
  id: string;
  host: string;
  databaseName: string;
  port: number;
  username: string;
  timeoutSeconds?: number;
  active?: boolean;
  databaseType: DatabaseType;
}

export interface SyncConnectionConfigRequest {
  host: string;
  databaseName: string;
  port: number;
  username: string;
  password: string;
  timeoutSeconds?: number;
  active?: boolean;
  databaseType: DatabaseType;
}
