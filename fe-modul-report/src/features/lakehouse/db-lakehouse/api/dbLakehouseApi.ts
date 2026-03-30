import axiosDataLakeClient from "../../../../services/axiosDataLakeClient";
import type {
  BronzeUploadResponse,
  BronzeImportRequest,
  DatabaseInfoResponse,
  SilverTransformRequest,
  SilverTransformResponse,
  GoldTransformRequest,
  GoldTransformResponse,
  PipelineRunRequest,
  PipelineResponse,
  ChatRequest,
  ChatResponse,
  ChartRequest,
  ChartResponse,
  ChatHistoryResponse,
  DatabaseListResponse,
  SSEEvent,
  SSEEventType,
} from "../types/dbLakehouse";

const BASE = "/api/v1/db-lakehouse";

function getBaseUrl(): string {
  return axiosDataLakeClient.defaults.baseURL || "";
}

async function readSSEStream(
  response: Response,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";

    for (const block of blocks) {
      if (!block.trim()) continue;
      let eventName: SSEEventType = "progress";
      let data = "";

      for (const line of block.split("\n")) {
        if (line.startsWith("event: ")) eventName = line.slice(7) as SSEEventType;
        if (line.startsWith("data: ")) data = line.slice(6);
      }

      if (data) {
        try {
          onEvent({ event: eventName, ...JSON.parse(data) });
        } catch {
          // skip malformed JSON
        }
      }
    }
  }
}

export const dbLakehouseApi = {
  // ============ Bronze Layer ============

  bronzeUpload: async (
    file: File,
    serverId?: string,
    databaseName?: string,
    onProgress?: (percent: number) => void,
  ): Promise<BronzeUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    if (serverId) formData.append("server_id", serverId);
    if (databaseName) formData.append("database_name", databaseName);
    const res = await axiosDataLakeClient.post(`${BASE}/bronze/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    return res.data;
  },

  bronzeImport: async (bakFilePath: string, body: BronzeImportRequest): Promise<BronzeUploadResponse> => {
    const res = await axiosDataLakeClient.post(`${BASE}/bronze/import`, body, {
      params: { bak_file_path: bakFilePath },
    });
    return res.data;
  },

  getBronze: async (databaseName: string, serverId?: string): Promise<DatabaseInfoResponse> => {
    const res = await axiosDataLakeClient.get(`${BASE}/bronze/${databaseName}`, {
      params: serverId ? { server_id: serverId } : undefined,
    });
    return res.data;
  },

  // ============ Silver Layer ============

  silverTransform: async (body: SilverTransformRequest): Promise<SilverTransformResponse> => {
    const res = await axiosDataLakeClient.post(`${BASE}/silver/transform`, body);
    return res.data;
  },

  getSilver: async (databaseName: string, serverId?: string): Promise<DatabaseInfoResponse> => {
    const res = await axiosDataLakeClient.get(`${BASE}/silver/${databaseName}`, {
      params: serverId ? { server_id: serverId } : undefined,
    });
    return res.data;
  },

  // ============ Gold Layer ============

  goldTransform: async (body: GoldTransformRequest): Promise<GoldTransformResponse> => {
    const res = await axiosDataLakeClient.post(`${BASE}/gold/transform`, body);
    return res.data;
  },

  getGold: async (databaseName: string, serverId?: string): Promise<DatabaseInfoResponse> => {
    const res = await axiosDataLakeClient.get(`${BASE}/gold/${databaseName}`, {
      params: serverId ? { server_id: serverId } : undefined,
    });
    return res.data;
  },

  // ============ Full Pipeline ============

  pipelineUpload: async (
    file: File,
    options?: {
      serverId?: string;
      bronzeDatabase?: string;
      silverDatabase?: string;
      goldDatabase?: string;
      autoClean?: boolean;
      autoStandardize?: boolean;
    },
    onProgress?: (percent: number) => void,
  ): Promise<PipelineResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.serverId) formData.append("server_id", options.serverId);
    if (options?.bronzeDatabase) formData.append("bronze_database", options.bronzeDatabase);
    if (options?.silverDatabase) formData.append("silver_database", options.silverDatabase);
    if (options?.goldDatabase) formData.append("gold_database", options.goldDatabase);
    if (options?.autoClean !== undefined) formData.append("auto_clean", String(options.autoClean));
    if (options?.autoStandardize !== undefined) formData.append("auto_standardize", String(options.autoStandardize));
    const res = await axiosDataLakeClient.post(`${BASE}/pipeline/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
    return res.data;
  },

  pipelineRun: async (bakFilePath: string, body: PipelineRunRequest): Promise<PipelineResponse> => {
    const res = await axiosDataLakeClient.post(`${BASE}/pipeline/run`, body, {
      params: { bak_file_path: bakFilePath },
    });
    return res.data;
  },

  // ============ Chat & Chart ============

  chat: async (body: ChatRequest): Promise<ChatResponse> => {
    const res = await axiosDataLakeClient.post(`${BASE}/chat`, body);
    return res.data;
  },

  chart: async (body: ChartRequest): Promise<ChartResponse> => {
    const res = await axiosDataLakeClient.post(`${BASE}/chart`, body);
    return res.data;
  },

  getChatHistory: async (sessionId: string): Promise<ChatHistoryResponse> => {
    const res = await axiosDataLakeClient.get(`${BASE}/chat/history/${sessionId}`);
    return res.data;
  },

  // ============ Database Management ============

  listDatabases: async (): Promise<DatabaseListResponse> => {
    const res = await axiosDataLakeClient.get(`${BASE}/databases`);
    return res.data;
  },

  getDatabase: async (databaseName: string, serverId?: string): Promise<DatabaseInfoResponse> => {
    const res = await axiosDataLakeClient.get(`${BASE}/database/${databaseName}`, {
      params: serverId ? { server_id: serverId } : undefined,
    });
    return res.data;
  },

  // ============ SSE Streaming ============

  bronzeUploadStream: async (
    file: File,
    onEvent: (event: SSEEvent) => void,
    serverId?: string,
    databaseName?: string,
  ): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    if (serverId) formData.append("server_id", serverId);
    if (databaseName) formData.append("database_name", databaseName);

    const response = await fetch(`${getBaseUrl()}${BASE}/bronze/upload/stream`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    await readSSEStream(response, onEvent);
  },

  silverTransformStream: async (
    body: SilverTransformRequest,
    onEvent: (event: SSEEvent) => void,
  ): Promise<void> => {
    const response = await fetch(`${getBaseUrl()}${BASE}/silver/transform/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    await readSSEStream(response, onEvent);
  },

  goldTransformStream: async (
    body: GoldTransformRequest,
    onEvent: (event: SSEEvent) => void,
  ): Promise<void> => {
    const response = await fetch(`${getBaseUrl()}${BASE}/gold/transform/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    await readSSEStream(response, onEvent);
  },

  pipelineUploadStream: async (
    file: File,
    onEvent: (event: SSEEvent) => void,
    options?: {
      serverId?: string;
      bronzeDatabase?: string;
      silverDatabase?: string;
      goldDatabase?: string;
      autoClean?: boolean;
      autoStandardize?: boolean;
    },
  ): Promise<void> => {
    const formData = new FormData();
    formData.append("file", file);
    if (options?.serverId) formData.append("server_id", options.serverId);
    if (options?.bronzeDatabase) formData.append("bronze_database", options.bronzeDatabase);
    if (options?.silverDatabase) formData.append("silver_database", options.silverDatabase);
    if (options?.goldDatabase) formData.append("gold_database", options.goldDatabase);
    if (options?.autoClean !== undefined) formData.append("auto_clean", String(options.autoClean));
    if (options?.autoStandardize !== undefined) formData.append("auto_standardize", String(options.autoStandardize));

    const response = await fetch(`${getBaseUrl()}${BASE}/pipeline/upload/stream`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    await readSSEStream(response, onEvent);
  },

  pipelineRunStream: async (
    bakFilePath: string,
    body: PipelineRunRequest,
    onEvent: (event: SSEEvent) => void,
  ): Promise<void> => {
    const response = await fetch(
      `${getBaseUrl()}${BASE}/pipeline/run/stream?bak_file_path=${encodeURIComponent(bakFilePath)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    await readSSEStream(response, onEvent);
  },
};
