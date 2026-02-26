export interface ServerConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  driver: string;
  trust_cert: boolean;
  windows_auth: boolean;
  is_default: boolean;
  created_at: string;
}

export interface ServerCreateRequest {
  name: string;
  host: string;
  port?: number;
  username?: string;
  password: string;
  driver?: string;
  trust_cert?: boolean;
  windows_auth?: boolean;
}

export interface ServerUpdateRequest {
  name?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  driver?: string;
  trust_cert?: boolean;
  windows_auth?: boolean;
}

export interface ServerListResponse {
  servers: ServerConfig[];
  total: number;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  databases: string[];
}

export interface ServerDeleteResponse {
  status: string;
  server_id: string;
}

export interface SetDefaultResponse {
  status: string;
  message: string;
}
