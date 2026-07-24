import { useState, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { usePivotEngine } from "./usePivotEngine";
import PivotConfigBar from "./PivotConfigBar";
import PivotGrid from "./PivotGrid";
import type {
  AggregationType,
  PivotField,
  PivotTableProps,
} from "../../types/table";

export function PivotTable({
  data,
  rowField,
  columnField,
  rowFields: rowFieldsProp,
  columnFields: columnFieldsProp,
  valueFields,
  aggregation,
  availableRowFields = [],
  availableColumnFields = [],
  availableValueFields = [],
  enableDrilldown = true,
  title,
  showToolbar = true,
  showConfig = true,
  onRefresh,
  maxHeight = 480,
  renderCell,
}: PivotTableProps) {
  // ── Local config state ────────────────────────────────────────────────
  const [localRowKeys, setLocalRowKeys] = useState<string[]>(() => {
    if (rowFieldsProp?.length) return rowFieldsProp.map((f) => f.key);
    if (rowField) return [rowField.key];
    return [];
  });
  const [localColKeys, setLocalColKeys] = useState<string[]>(() => {
    if (columnFieldsProp?.length) return columnFieldsProp.map((f) => f.key);
    if (columnField) return [columnField.key];
    return [];
  });
  const [localValueKeys, setLocalValueKeys] = useState<string[]>(
    valueFields.map((f) => f.key),
  );
  const [localAgg, setLocalAgg] = useState<AggregationType>(aggregation);
  const allFields = useMemo(() => {
    const map = new Map<string, PivotField>();
    [
      rowField,
      columnField,
      ...valueFields,
      ...availableRowFields,
      ...availableColumnFields,
      ...availableValueFields,
    ]
      .filter(Boolean)
      .forEach((f) => map.set(f!.key, f!));
    return map;
  }, [
    rowField,
    columnField,
    valueFields,
    availableRowFields,
    availableColumnFields,
    availableValueFields,
  ]);

  const activeRowFields = useMemo(
    () =>
      localRowKeys.map((k) => allFields.get(k)).filter(Boolean) as PivotField[],
    [localRowKeys, allFields],
  );
  const activeColFields = useMemo(
    () =>
      localColKeys.map((k) => allFields.get(k)).filter(Boolean) as PivotField[],
    [localColKeys, allFields],
  );
  const activeValueFields = useMemo(
    () =>
      localValueKeys
        .map((k) => allFields.get(k))
        .filter(Boolean) as PivotField[],
    [localValueKeys, allFields],
  );

  // ── Engine ────────────────────────────────────────────────────────────
  const engine = usePivotEngine({
    data,
    rowFields: activeRowFields,
    columnFields: activeColFields,
    valueFields: activeValueFields,
    aggregation: localAgg,
  });

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col">
      {showToolbar && (
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
          <span className="font-semibold text-base text-slate-900 tracking-tight">
            {title ?? "Pivot Table"}
          </span>
          <div className="flex items-center gap-3">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <RefreshCw size={13} />
                Làm mới
              </button>
            )}
          </div>
        </div>
      )}

      {showConfig && (
        <PivotConfigBar
          rowFieldKeys={localRowKeys}
          onRowFieldsChange={setLocalRowKeys}
          colFieldKeys={localColKeys}
          onColFieldsChange={setLocalColKeys}
          valueFieldKeys={localValueKeys}
          onValueFieldsChange={setLocalValueKeys}
          aggregation={localAgg}
          onAggregationChange={setLocalAgg}
          availableRowFields={availableRowFields}
          availableColumnFields={availableColumnFields}
          availableValueFields={availableValueFields}
        />
      )}

      <PivotGrid
        rowKeys={engine.rowKeys}
        columnKeys={engine.columnKeys}
        matrix={engine.matrix}
        rowTotals={engine.rowTotals}
        columnTotals={engine.columnTotals}
        grandTotal={engine.grandTotal}
        valueFields={activeValueFields}
        aggregation={localAgg}
        rowFieldCount={activeRowFields.length}
        rowFieldLabel={activeRowFields.map((f) => f.label).join(" / ")}
        columnFieldLabel={activeColFields.map((f) => f.label).join(" / ")}
        enableDrilldown={enableDrilldown}
        renderCell={renderCell}
        sortKey={engine.sortKey}
        sortDirection={engine.sortDirection}
        onSort={engine.toggleSort}
        maxHeight={maxHeight}
      />
    </div>
  );
}
