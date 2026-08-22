/**
 * Client cho Data Catalog (M04) của ai_worker_lake_house.
 * Dùng chung axios instance với module tiếp nhận dữ liệu.
 */
import { ingestionClient } from "./ingestionApi";

export type DatasetNamespace =
  | "bronze"
  | "silver"
  | "gold_report"
  | "gold_bi"
  | "gold_api"
  | "gold_ai"
  | "gold_approved_kg"
  | "gold_public";

export type DatasetStatus = "DRAFT" | "PUBLISHED" | "DEPRECATED" | "RETIRED";
export type SchemaChangeType = "INITIAL" | "ADDITIVE" | "BREAKING";

export interface DatasetField {
  name: string;
  data_type: string;
  nullable: boolean;
  description: string | null;
  is_pii: boolean;
  is_secret: boolean;
  tags: string | null;
  glossary_term_id: string | null;
}

export interface SchemaChangeDetail {
  added: string[];
  removed: string[];
  type_changed: { field: string; from: string; to: string }[];
  narrowed: string[];
  required_new: string[];
}

export interface DatasetVersion {
  id: string;
  version: string;
  change_type: SchemaChangeType;
  change_note: string | null;
  change_detail: SchemaChangeDetail | null;
  status: string;
  created_by: string;
  created_at: string | null;
  published_by: string | null;
  published_at: string | null;
  fields: DatasetField[];
}

export interface DatasetConsumer {
  type: string;
  ref: string;
  contact: string | null;
  subscribed_version: string | null;
  active: boolean;
}

export interface Dataset {
  id: string;
  code: string;
  name: string;
  namespace: DatasetNamespace;
  description: string | null;
  owner_user: string | null;
  owner_org_id: string | null;
  security_label_id: string | null;
  security_level: number;
  sla_freshness_hours: number | null;
  quality_rules: string | null;
  status: DatasetStatus;
  current_version: string | null;
  deprecated_at: string | null;
  retire_after: string | null;
  deprecation_note: string | null;
  created_by: string;
  created_at: string | null;
  versions?: DatasetVersion[];
  consumers?: DatasetConsumer[];
}

export interface ImpactResult {
  dataset: { code: string; status: string; current_version: string | null };
  downstream_datasets: {
    code: string;
    name: string;
    namespace: string;
    status: string;
    owner_user: string | null;
  }[];
  consumers: {
    type: string;
    ref: string;
    subscribed_version: string | null;
    contact: string | null;
  }[];
  total_affected: number;
}

export interface LineageNode {
  type: string;
  id: string;
}

export interface LineageGraph {
  root: LineageNode;
  depth: number;
  nodes: LineageNode[];
  edges: {
    source_type: string;
    source_id: string;
    target_type: string;
    target_id: string;
    kind: string;
    job_id: string | null;
    detail: string | null;
    created_at: string | null;
  }[];
}

export interface GlossaryTerm {
  id: string;
  code: string;
  name: string;
  definition: string;
  owner_user: string | null;
  status: string;
  synonyms: string | null;
}

interface Listing<T> {
  total: number;
  items: T[];
}

export const catalogApi = {
  listDatasets: async (params: {
    q?: string;
    namespace?: string;
    status?: string;
    page?: number;
    size?: number;
  }): Promise<Listing<Dataset> & { page: number; size: number }> =>
    (await ingestionClient.get("/api/v1/catalog/datasets", { params })).data,

  getDataset: async (ref: string): Promise<Dataset> =>
    (await ingestionClient.get(`/api/v1/catalog/datasets/${ref}`)).data,

  createDataset: async (payload: {
    code: string;
    name?: string;
    namespace: string;
    description?: string;
    owner_user?: string;
    owner_org_id?: string;
    security_label_id?: string;
    sla_freshness_hours?: number;
    quality_rules?: string;
    derived_from?: string[];
    source_object_ids?: string[];
  }): Promise<Dataset> =>
    (await ingestionClient.post("/api/v1/catalog/datasets", payload)).data,

  addVersion: async (
    ref: string,
    fields: Partial<DatasetField>[],
    changeNote?: string
  ): Promise<Dataset> =>
    (
      await ingestionClient.post(`/api/v1/catalog/datasets/${ref}/versions`, {
        fields,
        change_note: changeNote,
      })
    ).data,

  publish: async (ref: string): Promise<Dataset> =>
    (await ingestionClient.post(`/api/v1/catalog/datasets/${ref}/publish`)).data,

  deprecate: async (
    ref: string,
    note: string,
    transitionDays: number
  ): Promise<{
    retire_after: string;
    notified_consumers: { type: string; ref: string; contact: string | null }[];
  }> =>
    (
      await ingestionClient.post(`/api/v1/catalog/datasets/${ref}/deprecate`, {
        note,
        transition_days: transitionDays,
      })
    ).data,

  impact: async (ref: string): Promise<ImpactResult> =>
    (await ingestionClient.get(`/api/v1/catalog/datasets/${ref}/impact`)).data,

  registerConsumer: async (
    ref: string,
    payload: { consumer_type: string; consumer_ref: string; contact?: string }
  ): Promise<unknown> =>
    (await ingestionClient.post(`/api/v1/catalog/datasets/${ref}/consumers`, payload)).data,

  listGlossary: async (): Promise<Listing<GlossaryTerm>> =>
    (await ingestionClient.get("/api/v1/catalog/glossary")).data,

  createTerm: async (payload: {
    code: string;
    name?: string;
    definition: string;
    synonyms?: string;
  }): Promise<GlossaryTerm> =>
    (await ingestionClient.post("/api/v1/catalog/glossary", payload)).data,

  lineage: async (
    resourceType: string,
    resourceId: string,
    depth = 3
  ): Promise<LineageGraph> =>
    (
      await ingestionClient.get("/api/v1/lineage", {
        params: { resource_type: resourceType, resource_id: resourceId, depth },
      })
    ).data,
};

export default catalogApi;
