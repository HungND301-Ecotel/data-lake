/**
 * Client tìm kiếm hybrid (M08).
 * Facet và gợi ý đều chỉ tính trên phần người dùng được phép đọc, nên con số
 * hiển thị ở đây là con số của riêng họ.
 */
import { ingestionClient } from "./ingestionApi";

export type SearchKind = "CHUNK" | "OBJECT" | "DATASET" | "GLOSSARY";

export interface SearchHit {
  document_id: string;
  kind: SearchKind;
  resource_id: string;
  title: string;
  snippet: string;
  locator: string | null;
  source_version: string | null;
  security_level: number;
  owner_org_id: string | null;
  indexed_at: string | null;
  score: number;
  matched_by: Record<string, { rank: number; score: number }>;
}

export interface SearchFacets {
  kind: Record<string, number>;
  security_level: Record<string, number>;
  visible_documents: number;
  returned: number;
}

export interface IndexFreshness {
  last_indexed_at: string | null;
  age_seconds: number | null;
  stale: boolean;
}

export interface SearchResponse {
  took_ms: number;
  terms: string[];
  tools: string[];
  total: number;
  trimmed: number;
  items: SearchHit[];
  facets: SearchFacets;
  index: IndexFreshness;
}

export interface SearchPreview {
  document_id: string;
  kind: SearchKind;
  resource_id: string;
  title: string;
  locator: string | null;
  source_version: string | null;
  security_level: number;
  indexed_at: string | null;
  content: string;
  truncated: boolean;
  highlights: string;
}

export interface SavedQuery {
  id: string;
  name: string;
  q: string;
  filters: Record<string, unknown>;
  last_run_at: string | null;
  run_count: number;
  created_at: string | null;
}

export const searchApi = {
  search: async (payload: {
    q: string;
    kinds?: SearchKind[];
    vector?: boolean;
    limit?: number;
  }): Promise<SearchResponse> =>
    (await ingestionClient.post("/api/v1/search", payload)).data,

  suggest: async (q: string, limit = 10): Promise<{ items: { term: string; documents: number }[] }> =>
    (await ingestionClient.get("/api/v1/suggest", { params: { q, limit } })).data,

  preview: async (documentId: string, q?: string): Promise<SearchPreview> =>
    (await ingestionClient.get(`/api/v1/search/preview/${documentId}`, {
      params: { q },
    })).data,

  reindex: async (): Promise<Record<string, number>> =>
    (await ingestionClient.post("/api/v1/search/reindex")).data,

  listSaved: async (): Promise<{ total: number; items: SavedQuery[] }> =>
    (await ingestionClient.get("/api/v1/saved-queries")).data,

  save: async (payload: {
    name: string;
    q: string;
    filters?: Record<string, unknown>;
  }): Promise<SavedQuery> =>
    (await ingestionClient.post("/api/v1/saved-queries", payload)).data,

  runSaved: async (id: string): Promise<SearchResponse> =>
    (await ingestionClient.post(`/api/v1/saved-queries/${id}/run`)).data,

  deleteSaved: async (id: string): Promise<void> => {
    await ingestionClient.delete(`/api/v1/saved-queries/${id}`);
  },
};

export default searchApi;
