import { useState, useEffect, useCallback } from "react";
import { healthApi } from "../api/datalakeApi";
import type { HealthStatus, ReadyStatus } from "../types/datalake";

interface UseHealthCheckReturn {
  healthStatus: HealthStatus | null;
  readyStatus: ReadyStatus | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useHealthCheck(pollInterval = 30000): UseHealthCheckReturn {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [readyStatus, setReadyStatus] = useState<ReadyStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const [health, ready] = await Promise.all([
        healthApi.check(),
        healthApi.ready(),
      ]);
      setHealthStatus(health);
      setReadyStatus(ready);
    } catch (err) {
      console.error("Health check failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, pollInterval);
    return () => clearInterval(interval);
  }, [fetchHealth, pollInterval]);

  return {
    healthStatus,
    readyStatus,
    loading,
    refresh: fetchHealth,
  };
}
