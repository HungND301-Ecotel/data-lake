import axiosDataLakeClient from "../../../services/axiosDataLakeClient";
import type {
  DatabaseListResponse,
  SchemaResponse,
  TableQueryRequest,
  TableQueryResponse,
  NaturalQueryRequest,
  NaturalQueryResponse,
} from "../types/database";

export const databaseExplorerApi = {
  listDatabases: async (serverId?: string): Promise<DatabaseListResponse> => {
    const res = await axiosDataLakeClient.get("/api/v1/database/list", {
      params: { server_id: serverId },
    });
    return res.data;
  },

  getSchema: async (database: string, serverId?: string, refresh?: boolean): Promise<SchemaResponse> => {
    const res = await axiosDataLakeClient.get(`/api/v1/database/schema/${database}`, {
      params: { server_id: serverId, refresh },
    });
    return res.data;
  },

  getTables: async (database: string, serverId?: string): Promise<string[]> => {
    const res = await axiosDataLakeClient.get(`/api/v1/database/tables/${database}`, {
      params: { server_id: serverId },
    });
    return res.data;
  },

  queryTable: async (req: TableQueryRequest): Promise<TableQueryResponse> => {
    const res = await axiosDataLakeClient.post("/api/v1/database/query/table", req);
    return res.data;
  },

  queryNatural: async (req: NaturalQueryRequest): Promise<NaturalQueryResponse> => {
    const res = await axiosDataLakeClient.post("/api/v1/database/query/natural", req);
    return res.data;
  },
};
