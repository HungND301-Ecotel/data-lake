import type { LakehouseChart } from "../../shared/types/lakehouse";

export interface TableQaResponse {
  answer: string;
  data_context: {
    columns: string[];
    row_count: number;
    sample_data: Record<string, unknown>[];
  };
  chart: LakehouseChart | null;
}
