import { useState, useCallback } from "react";
import { databaseExplorerApi } from "../api/databaseExplorerApi";
import type {
  SchemaResponse,
  TableQueryRequest,
  TableQueryResponse,
  NaturalQueryResponse,
} from "../types/database";

export function useDatabaseExplorer() {
  const [databases, setDatabases] = useState<string[]>([]);
  const [selectedDb, setSelectedDb] = useState<string | null>(null);
  const [serverId, setServerId] = useState<string | undefined>(undefined);
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [queryResult, setQueryResult] = useState<TableQueryResponse | NaturalQueryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDatabases = useCallback(async (sId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await databaseExplorerApi.listDatabases(sId);
      setDatabases(res.databases);
      if (sId !== undefined) setServerId(sId);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e.response?.data?.detail || e.message || "Lỗi tải danh sách database");
    } finally {
      setLoading(false);
    }
  }, []);

  const selectDatabase = useCallback(async (db: string) => {
    setSelectedDb(db);
    setSchemaLoading(true);
    setError(null);
    try {
      const res = await databaseExplorerApi.getSchema(db, serverId);
      setSchema(res);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e.response?.data?.detail || e.message || "Lỗi tải schema");
    } finally {
      setSchemaLoading(false);
    }
  }, [serverId]);

  const queryTable = useCallback(async (req: TableQueryRequest) => {
    setQueryLoading(true);
    setError(null);
    try {
      const res = await databaseExplorerApi.queryTable({ ...req, server_id: serverId });
      setQueryResult(res);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e.response?.data?.detail || e.message || "Lỗi truy vấn");
    } finally {
      setQueryLoading(false);
    }
  }, [serverId]);

  const queryNatural = useCallback(async (question: string, database: string) => {
    setQueryLoading(true);
    setError(null);
    try {
      const res = await databaseExplorerApi.queryNatural({ question, database, server_id: serverId });
      setQueryResult(res);
      return res;
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(e.response?.data?.detail || e.message || "Lỗi truy vấn");
      return null;
    } finally {
      setQueryLoading(false);
    }
  }, [serverId]);

  return {
    databases,
    selectedDb,
    schema,
    queryResult,
    loading,
    schemaLoading,
    queryLoading,
    error,
    fetchDatabases,
    selectDatabase,
    queryTable,
    queryNatural,
    setServerId,
  };
}
