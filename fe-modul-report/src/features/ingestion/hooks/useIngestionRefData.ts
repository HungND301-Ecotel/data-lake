import { useCallback, useEffect, useState } from "react";
import ingestionApi from "../api/ingestionApi";
import type {
  DataSource,
  Organization,
  RetentionPolicy,
  SecurityLabel,
} from "../types/ingestion";

/**
 * Reference data required before anything can be ingested (doc 2 -
 * "metadata first"). Loaded once and shared by the upload form.
 */
export function useIngestionRefData() {
  const [labels, setLabels] = useState<SecurityLabel[]>([]);
  const [retentions, setRetentions] = useState<RetentionPolicy[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [labelsRes, retentionRes, orgRes, sourceRes] = await Promise.all([
        ingestionApi.listSecurityLabels(),
        ingestionApi.listRetentionPolicies(),
        ingestionApi.listOrganizations(),
        ingestionApi.listDataSources(),
      ]);
      setLabels(labelsRes.items);
      setRetentions(retentionRes.items);
      setOrganizations(orgRes.items);
      setSources(sourceRes.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu tham chiếu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { labels, retentions, organizations, sources, loading, error, reload: load };
}
