/**
 * Client Knowledge Graph (tài liệu 6.3).
 * Chỉ quan hệ đã duyệt mới đi vào câu trả lời, nên hàng đợi duyệt ở đây là
 * cổng thật chứ không phải bước hình thức.
 */
import { ingestionClient } from "./ingestionApi";

export type GraphReviewStatus = "CANDIDATE" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export interface OntologyEntity {
  code: string;
  name: string;
  description: string | null;
}

export interface OntologyPredicate {
  code: string;
  name: string;
  sensitive: boolean;
  subject_types: string[];
  object_types: string[];
}

export interface GraphEntity {
  id: string;
  type: string;
  name: string;
  canonical_key: string;
  aliases: string[];
  security_level: number;
  owner_org_id: string | null;
  resolution_method: string;
  merged_into_id: string | null;
  first_seen_at: string | null;
}

export interface GraphRelationship {
  id: string;
  subject_entity_id: string;
  predicate: string;
  object_entity_id: string;
  confidence: number;
  resolution_method: string;
  review_status: GraphReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  security_level: number;
  source_object_id: string;
  source_location: string;
  extractor_version: string;
  created_at: string | null;
  created_by: string;
}

export interface GraphNeighbour {
  relationship: GraphRelationship;
  entity: GraphEntity;
  direction: "IN" | "OUT";
}

export interface GraphPathStep {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
  source_object_id: string;
  source_location: string;
  extractor_version: string;
  reviewed_by: string | null;
  relationship_id: string;
  security_level: number;
}

export interface GraphQueryResult {
  seeds: { id: string; type: string; name: string; security_level: number }[];
  paths: { hops: number; path: GraphPathStep[]; endpoint: { id: string; name: string } }[];
  visited: number;
  trimmed: number;
  note?: string;
}

export interface MergeProposal {
  id: string;
  confidence: number;
  method: string;
  rationale: string | null;
  source: GraphEntity | null;
  target: GraphEntity | null;
  created_at: string | null;
}

export const graphApi = {
  ontology: async (): Promise<{
    entities: OntologyEntity[];
    predicates: OntologyPredicate[];
  }> => (await ingestionClient.get("/api/v1/graph/ontology")).data,

  defineTerm: async (payload: {
    kind: "ENTITY" | "PREDICATE";
    code: string;
    name?: string;
    description?: string;
    subject_types?: string[];
    object_types?: string[];
    sensitive?: boolean;
  }): Promise<unknown> =>
    (await ingestionClient.post("/api/v1/graph/ontology", payload)).data,

  entities: async (q?: string, limit = 20): Promise<{ total: number; items: GraphEntity[] }> =>
    (await ingestionClient.get("/api/v1/graph/entities", { params: { q, limit } })).data,

  entity: async (id: string): Promise<GraphEntity & { neighbours: GraphNeighbour[] }> =>
    (await ingestionClient.get(`/api/v1/graph/entities/${id}`)).data,

  relationships: async (
    status?: GraphReviewStatus,
    limit = 50
  ): Promise<{ total: number; items: GraphRelationship[] }> =>
    (await ingestionClient.get("/api/v1/graph/relationships", {
      params: { status, limit },
    })).data,

  review: async (
    id: string,
    approved: boolean,
    note?: string
  ): Promise<GraphRelationship> =>
    (await ingestionClient.post(`/api/v1/graph/relationships/${id}/review`, {
      approved,
      note,
    })).data,

  merges: async (): Promise<{ total: number; items: MergeProposal[] }> =>
    (await ingestionClient.get("/api/v1/graph/merges")).data,

  reviewMerge: async (id: string, approved: boolean): Promise<unknown> =>
    (await ingestionClient.post(`/api/v1/graph/merges/${id}/review`, { approved })).data,

  query: async (payload: {
    q?: string;
    entity_id?: string;
    max_hops?: number;
    limit?: number;
  }): Promise<GraphQueryResult> =>
    (await ingestionClient.post("/api/v1/graph/query", payload)).data,
};

export default graphApi;
