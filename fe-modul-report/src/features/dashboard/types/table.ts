import React from "react";

export interface PivotField {
  key: string;
  label: string;
  type?: "string" | "number" | "date";
  format?: "number" | "currency" | "percent" | "compact" | "raw";
  currencyCode?: string;
  decimals?: number;
  locale?: string;
  unit?: string;
}

export type AggregationType = "sum" | "avg" | "count" | "min" | "max";

export interface PivotCell {
  raw: Record<string, unknown>[];
  value: number;
  formattedValue: string;
}

export interface PivotTableProps {
  data: Record<string, unknown>[];
  /** Backward compat: single field */
  rowField?: PivotField;
  columnField?: PivotField;
  /** Multi-field (takes priority) */
  rowFields?: PivotField[];
  columnFields?: PivotField[];
  valueFields: PivotField[];
  aggregation: AggregationType;
  availableRowFields?: PivotField[];
  availableColumnFields?: PivotField[];
  availableValueFields?: PivotField[];
  enableDrilldown?: boolean;
  title?: string;
  showToolbar?: boolean;
  showConfig?: boolean;
  onRefresh?: () => void;
  maxHeight?: number | string;
  renderCell?: (
    value: number,
    cell: PivotCell,
    rowKey: string,
    colKey: string,
    fieldKey: string,
  ) => React.ReactNode;
}
