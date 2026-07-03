import { useState, useMemo, useCallback } from "react";
import type { AggregationType, PivotCell, PivotField } from "../../types/table";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function aggregate(values: number[], type: AggregationType): number {
  if (values.length === 0) return 0;
  switch (type) {
    case "sum":
      return values.reduce((a, b) => a + b, 0);
    case "avg":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "count":
      return values.length;
    case "min":
      return Math.min(...values);
    case "max":
      return Math.max(...values);
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

function formatValue(value: number, field: PivotField): string {
  const locale = field.locale || "vi-VN";
  const decimals = field.decimals;
  switch (field.format) {
    case "currency":
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: field.currencyCode || "VND",
        minimumFractionDigits: decimals ?? 0,
        maximumFractionDigits: decimals ?? 0,
      }).format(value);
    case "percent":
      return `${value.toFixed(decimals ?? 1)}%`;
    case "compact":
      return new Intl.NumberFormat(locale, {
        notation: "compact",
        maximumFractionDigits: decimals ?? 1,
      }).format(value);
    case "raw":
      return String(value);
    default:
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals ?? 0,
        maximumFractionDigits: decimals ?? 2,
      }).format(Math.round(value));
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UsePivotEngineOptions {
  data: Record<string, unknown>[];
  rowFields: PivotField[];
  columnFields: PivotField[];
  valueFields: PivotField[];
  aggregation: AggregationType;
}

export function usePivotEngine({
  data,
  rowFields,
  columnFields,
  valueFields,
  aggregation,
}: UsePivotEngineOptions) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    null,
  );

  const pivotResult = useMemo(() => {
    // ── Step 1: Build O(n) lookup map ─────────────────────────────────
    // map[rowKey][colKey] = array of matching records
    const lookup = new Map<string, Map<string, Record<string, unknown>[]>>();
    const rowSet = new Set<string>();
    const colSet = new Set<string>();

    for (const rec of data) {
      const rk = rowFields.map((f) => String(rec[f.key] ?? "—")).join(" / ");
      const ck = columnFields.map((f) => String(rec[f.key] ?? "—")).join(" / ");
      rowSet.add(rk);
      colSet.add(ck);

      if (!lookup.has(rk)) lookup.set(rk, new Map());
      const colMap = lookup.get(rk)!;
      if (!colMap.has(ck)) colMap.set(ck, []);
      colMap.get(ck)!.push(rec);
    }

    let rowKeys = Array.from(rowSet);
    let columnKeys = Array.from(colSet);

    // ── Step 2: Build matrix, row/col totals, grand total ─────────────
    const matrix: Record<
      string,
      Record<string, Record<string, PivotCell>>
    > = {};
    const rowTotals: Record<string, Record<string, PivotCell>> = {};
    const columnTotals: Record<string, Record<string, PivotCell>> = {};
    const grandTotal: Record<string, PivotCell> = {};

    // Row totals accumulator: rowKey → fieldKey → all records
    const rowAccum = new Map<string, Map<string, Record<string, unknown>[]>>();
    // Col totals accumulator: colKey → fieldKey → all records
    const colAccum = new Map<string, Map<string, Record<string, unknown>[]>>();

    for (const rk of rowKeys) {
      matrix[rk] = {};
      rowAccum.set(rk, new Map());

      for (const ck of columnKeys) {
        matrix[rk][ck] = {};
        if (!colAccum.has(ck)) colAccum.set(ck, new Map());

        const recs = lookup.get(rk)?.get(ck) ?? [];

        for (const vf of valueFields) {
          const nums = recs.map((r) => Number(r[vf.key] ?? 0));
          const val = aggregate(nums, aggregation);

          matrix[rk][ck][vf.key] = {
            raw: recs,
            value: val,
            formattedValue: formatValue(val, vf),
          };

          // Accumulate for row totals
          if (!rowAccum.get(rk)!.has(vf.key)) rowAccum.get(rk)!.set(vf.key, []);
          rowAccum
            .get(rk)!
            .get(vf.key)!
            .push(...recs);

          // Accumulate for col totals
          if (!colAccum.get(ck)!.has(vf.key)) colAccum.get(ck)!.set(vf.key, []);
          colAccum
            .get(ck)!
            .get(vf.key)!
            .push(...recs);
        }
      }
    }

    // Compute row totals
    for (const rk of rowKeys) {
      rowTotals[rk] = {};
      for (const vf of valueFields) {
        const recs = rowAccum.get(rk)?.get(vf.key) ?? [];
        const nums = recs.map((r) => Number(r[vf.key] ?? 0));
        const val = aggregate(nums, aggregation);
        rowTotals[rk][vf.key] = {
          raw: recs,
          value: val,
          formattedValue: formatValue(val, vf),
        };
      }
    }

    // Compute column totals
    for (const ck of columnKeys) {
      columnTotals[ck] = {};
      for (const vf of valueFields) {
        const recs = colAccum.get(ck)?.get(vf.key) ?? [];
        const nums = recs.map((r) => Number(r[vf.key] ?? 0));
        const val = aggregate(nums, aggregation);
        columnTotals[ck][vf.key] = {
          raw: recs,
          value: val,
          formattedValue: formatValue(val, vf),
        };
      }
    }

    // Grand total
    for (const vf of valueFields) {
      const nums = data.map((r) => Number(r[vf.key] ?? 0));
      const val = aggregate(nums, aggregation);
      grandTotal[vf.key] = {
        raw: data,
        value: val,
        formattedValue: formatValue(val, vf),
      };
    }

    // ── Step 3: Sort ──────────────────────────────────────────────────
    if (sortKey && sortDirection) {
      if (sortKey === "row") {
        rowKeys = [...rowKeys].sort((a, b) =>
          sortDirection === "asc" ? a.localeCompare(b) : b.localeCompare(a),
        );
      } else if (sortKey === "column") {
        columnKeys = [...columnKeys].sort((a, b) =>
          sortDirection === "asc" ? a.localeCompare(b) : b.localeCompare(a),
        );
      } else {
        rowKeys = [...rowKeys].sort((a, b) => {
          const aVal = rowTotals[a]?.[sortKey]?.value ?? 0;
          const bVal = rowTotals[b]?.[sortKey]?.value ?? 0;
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        });
      }
    }

    return { rowKeys, columnKeys, matrix, rowTotals, columnTotals, grandTotal };
  }, [
    data,
    rowFields,
    columnFields,
    valueFields,
    aggregation,
    sortKey,
    sortDirection,
  ]);

  const toggleSort = useCallback(
    (target: string) => {
      if (sortKey !== target) {
        setSortKey(target);
        setSortDirection("asc");
        return;
      }
      if (sortDirection === "asc") {
        setSortDirection("desc");
        return;
      }
      setSortKey(null);
      setSortDirection(null);
    },
    [sortKey, sortDirection],
  );
  const exportCsv = useCallback(() => {
    const lines: string[] = [];

    // Header
    lines.push([
      "Row",
      ...pivotResult.columnKeys,
    ].join(","));

    // Data
    for (const rowKey of pivotResult.rowKeys) {
      const row: string[] = [rowKey];

      for (const colKey of pivotResult.columnKeys) {
        const firstValueField = valueFields[0];

        const cell =
          pivotResult.matrix[rowKey]?.[colKey]?.[firstValueField.key];

        row.push(cell ? String(cell.value) : "");
      }

      lines.push(row.join(","));
    }

    return lines.join("\n");
  }, [pivotResult, valueFields]);
  
  return {
    ...pivotResult,
    sortKey,
    sortDirection,
    exportCsv,
    toggleSort,
  };
}
