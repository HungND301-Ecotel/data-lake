import React from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { PivotField, PivotCell, AggregationType } from "../../types/table";

export interface PivotGridProps {
  rowKeys: string[];
  columnKeys: string[];
  matrix: Record<string, Record<string, Record<string, PivotCell>>>;
  rowTotals: Record<string, Record<string, PivotCell>>;
  columnTotals: Record<string, Record<string, PivotCell>>;
  grandTotal: Record<string, PivotCell>;
  valueFields: PivotField[];
  aggregation?: AggregationType;
  /** Number of row fields — used to decide grouped rendering */
  rowFieldCount?: number;
  rowFieldLabel: string;
  columnFieldLabel: string;
  enableDrilldown?: boolean;
  onCellClick?: (rawData: Record<string, unknown>[], label: string) => void;
  renderCell?: (
    value: number,
    cell: PivotCell,
    rowKey: string,
    colKey: string,
    fieldKey: string,
  ) => React.ReactNode;
  sortKey?: string | null;
  sortDirection?: "asc" | "desc" | null;
  onSort?: (target: string) => void;
  maxHeight?: number | string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SEP = " / ";

const AGGREGATION_HEADER_MAP: Record<
  AggregationType,
  { header: string; grandTotal: string }
> = {
  sum: { header: "Tổng", grandTotal: "Tổng cộng" },
  avg: { header: "Trung bình", grandTotal: "Trung bình" },
  count: { header: "Đếm", grandTotal: "Tổng đếm" },
  min: { header: "Nhỏ nhất", grandTotal: "Nhỏ nhất" },
  max: { header: "Lớn nhất", grandTotal: "Lớn nhất" },
};

/**
 * Parse a composite rowKey "GroupA / SubItem" into [groupPart, leafPart].
 * When rowFieldCount === 1, returns [null, fullKey].
 */
function parseRowKey(
  rk: string,
  rowFieldCount: number,
): { group: string | null; leaf: string } {
  if (rowFieldCount <= 1) return { group: null, leaf: rk };
  const idx = rk.indexOf(SEP);
  if (idx === -1) return { group: null, leaf: rk };
  return { group: rk.slice(0, idx), leaf: rk.slice(idx + SEP.length) };
}

// ─── Sort Indicator ───────────────────────────────────────────────────────────

const SortIndicator: React.FC<{
  target: string;
  sortKey?: string | null;
  sortDirection?: "asc" | "desc" | null;
}> = ({ target, sortKey, sortDirection }) => {
  if (sortKey !== target || !sortDirection)
    return <ArrowUpDown className="inline ml-1 h-3 w-3 text-slate-400/60" />;
  return sortDirection === "asc" ? (
    <ArrowUp className="inline ml-1 h-3 w-3 text-emerald-600" />
  ) : (
    <ArrowDown className="inline ml-1 h-3 w-3 text-emerald-600" />
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PivotGrid({
  rowKeys,
  columnKeys,
  matrix,
  rowTotals,
  columnTotals,
  grandTotal,
  valueFields,
  aggregation = "sum",
  rowFieldCount = 1,
  rowFieldLabel,
  enableDrilldown = true,
  onCellClick,
  renderCell,
  sortKey,
  sortDirection,
  onSort,
  maxHeight = 480,
}: PivotGridProps) {
  const isMultiValue = valueFields.length > 1;
  const isGrouped = rowFieldCount > 1;
  const aggMeta =
    AGGREGATION_HEADER_MAP[aggregation] ?? AGGREGATION_HEADER_MAP.sum;

  // Build grouped structure: Map<groupLabel, rowKey[]>
  const groups = React.useMemo(() => {
    if (!isGrouped) return null;
    const map = new Map<string, string[]>();
    for (const rk of rowKeys) {
      const { group } = parseRowKey(rk, rowFieldCount);
      const g = group ?? "__ungrouped__";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(rk);
    }
    return map;
  }, [rowKeys, rowFieldCount]);

  // ── Shared click handler helper ───────────────────────────────────────
  const cellClickHandler = (cell: PivotCell | undefined, label: string) =>
    enableDrilldown && (cell?.raw?.length ?? 0) > 0 && onCellClick
      ? () => onCellClick(cell!.raw, label)
      : undefined;

  // ── Cell renderer helpers ─────────────────────────────────────────────
  const renderDataCell = (rk: string, ck: string, vf: PivotField) => {
    const cell = matrix[rk]?.[ck]?.[vf.key];

    if (renderCell && cell) {
      return (
        <td
          key={`${ck}-${vf.key}`}
          className="px-4 py-2.5 border-r border-slate-100 whitespace-nowrap"
        >
          {renderCell(cell.value, cell, rk, ck, vf.key)}
        </td>
      );
    }

    const onClick = cellClickHandler(cell, `${rk} — ${ck} (${vf.label})`);
    return (
      <td
        key={`${ck}-${vf.key}`}
        className={`px-4 py-2.5 text-[13px] text-right font-mono border-r border-slate-100 whitespace-nowrap transition-colors ${
          onClick ? "cursor-pointer hover:bg-blue-50/50" : ""
        }`}
        onClick={onClick}
        title={onClick ? "Click để xem chi tiết" : undefined}
      >
        <span className="font-medium text-slate-700">
          {cell?.formattedValue ?? "—"}
        </span>
      </td>
    );
  };

  const renderRowTotal = (rk: string, vf: PivotField) => {
    const cell = rowTotals[rk]?.[vf.key];
    const onClick = cellClickHandler(
      cell,
      `${rk} — ${aggMeta.header} (${vf.label})`,
    );
    return (
      <td
        key={`row-total-${vf.key}`}
        className={`px-4 py-2.5 text-[13px] text-right font-mono font-semibold text-slate-800 bg-slate-50 border-l border-slate-200 whitespace-nowrap transition-colors ${
          onClick ? "cursor-pointer hover:bg-slate-100" : ""
        }`}
        onClick={onClick}
      >
        {cell?.formattedValue ?? "—"}
      </td>
    );
  };

  // ── Rows renderer ─────────────────────────────────────────────────────
  const renderRows = () => {
    if (!isGrouped || !groups) {
      return rowKeys.map((rk, ri) => (
        <tr
          key={rk}
          className={`border-b border-slate-100 transition-colors ${ri % 2 === 0 ? "bg-white" : "bg-slate-50/20"} hover:bg-slate-50`}
        >
          <td className="px-4 py-2.5 text-sm font-medium text-slate-900 border-r border-slate-200 sticky left-0 bg-inherit z-10 whitespace-nowrap">
            {rk}
          </td>
          {columnKeys.map((ck) =>
            valueFields.map((vf) => renderDataCell(rk, ck, vf)),
          )}
          {valueFields.map((vf) => renderRowTotal(rk, vf))}
        </tr>
      ));
    }

    const rows: React.ReactNode[] = [];
    let globalIdx = 0;

    for (const [groupLabel, groupRowKeys] of groups) {
      rows.push(
        <tr
          key={`group-${groupLabel}`}
          className="bg-slate-100/70 border-y border-slate-200"
        >
          <td
            colSpan={
              columnKeys.length * valueFields.length + valueFields.length + 1
            }
            className="px-4 py-2 text-[11px] font-bold text-slate-600 uppercase tracking-wider sticky left-0 bg-slate-100/70"
          >
            {groupLabel}
          </td>
        </tr>,
      );

      groupRowKeys.forEach((rk) => {
        const { leaf } = parseRowKey(rk, rowFieldCount);
        const isEven = globalIdx % 2 === 0;
        globalIdx++;

        rows.push(
          <tr
            key={rk}
            className={`border-b border-slate-100 transition-colors ${isEven ? "bg-white" : "bg-slate-50/20"} hover:bg-slate-50`}
          >
            <td className="border-r border-slate-200 sticky left-0 bg-inherit z-10 whitespace-nowrap">
              <div className="flex items-center gap-2 px-4 py-2.5">
                <span className="w-3 shrink-0 border-b border-l border-slate-300 h-3 rounded-bl-sm ml-1" />
                <span className="text-sm font-medium text-slate-800">
                  {leaf}
                </span>
              </div>
            </td>
            {columnKeys.map((ck) =>
              valueFields.map((vf) => renderDataCell(rk, ck, vf)),
            )}
            {valueFields.map((vf) => renderRowTotal(rk, vf))}
          </tr>,
        );
      });
    }

    return rows;
  };

  return (
    <div className="overflow-auto" style={{ maxHeight }}>
      <table className="w-full border-collapse text-left min-w-max">
        <thead className="sticky top-0 z-10 select-none">
          {/* Row 1: Column group headers */}
          <tr className="bg-slate-50 border-b border-slate-200">
            <th
              className="px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-200 bg-slate-50 sticky left-0 z-20 min-w-[220px]"
              rowSpan={isMultiValue ? 2 : 1}
            >
              <div
                className={`flex items-center gap-1 ${onSort ? "cursor-pointer hover:text-slate-800" : ""}`}
                onClick={onSort ? () => onSort("row") : undefined}
              >
                <span>{rowFieldLabel}</span>
                {onSort && (
                  <SortIndicator
                    target="row"
                    sortKey={sortKey}
                    sortDirection={sortDirection}
                  />
                )}
              </div>
            </th>

            {columnKeys.map((ck) => (
              <th
                key={ck}
                colSpan={valueFields.length}
                className="px-3 py-2.5 text-[11px] font-semibold text-slate-600 uppercase tracking-wider text-center border-x border-slate-100 bg-slate-50"
              >
                {ck}
              </th>
            ))}

            <th
              colSpan={valueFields.length}
              className="px-3 py-2.5 text-[11px] font-semibold text-slate-700 uppercase tracking-wider text-center bg-slate-100 border-l border-slate-200"
            >
              {aggMeta.header}
            </th>
          </tr>

          {/* Row 2: Value sub-headers (multi-value only) */}
          {isMultiValue && (
            <tr className="bg-slate-50/80 border-b border-slate-200">
              {columnKeys.map((ck) =>
                valueFields.map((vf) => (
                  <th
                    key={`${ck}-${vf.key}`}
                    className="px-3 py-2 text-[10px] font-medium text-slate-400 uppercase text-center border-r border-slate-100 whitespace-nowrap"
                  >
                    {vf.label}
                  </th>
                )),
              )}
              {valueFields.map((vf) => (
                <th
                  key={`total-${vf.key}`}
                  className={`px-3 py-2 text-[10px] font-semibold text-slate-500 uppercase text-center border-r border-slate-100 bg-slate-100/60 whitespace-nowrap ${onSort ? "cursor-pointer hover:text-slate-800" : ""}`}
                  onClick={onSort ? () => onSort(vf.key) : undefined}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{vf.label}</span>
                    {onSort && (
                      <SortIndicator
                        target={vf.key}
                        sortKey={sortKey}
                        sortDirection={sortDirection}
                      />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          )}
        </thead>

        <tbody>
          {renderRows()}

          {/* Column totals row */}
          <tr className="border-t-2 border-slate-300 bg-slate-50">
            <td className="px-4 py-3 text-sm font-semibold text-slate-800 border-r border-slate-200 sticky left-0 bg-slate-50 z-10 whitespace-nowrap">
              {aggMeta.grandTotal}
            </td>

            {columnKeys.map((ck) =>
              valueFields.map((vf) => {
                const cell = columnTotals[ck]?.[vf.key];
                const onClick = cellClickHandler(
                  cell,
                  `${aggMeta.header} ${ck} (${vf.label})`,
                );
                return (
                  <td
                    key={`col-total-${ck}-${vf.key}`}
                    className={`px-4 py-3 text-[13px] text-right font-mono font-semibold text-slate-800 border-r border-slate-100 whitespace-nowrap transition-colors ${
                      onClick ? "cursor-pointer hover:bg-slate-100" : ""
                    }`}
                    onClick={onClick}
                  >
                    {cell?.formattedValue ?? "—"}
                  </td>
                );
              }),
            )}

            {valueFields.map((vf) => {
              const cell = grandTotal[vf.key];
              const onClick = cellClickHandler(
                cell,
                `${aggMeta.grandTotal} (${vf.label})`,
              );
              return (
                <td
                  key={`grand-total-${vf.key}`}
                  className={`px-4 py-3 text-[13px] text-right font-mono font-bold text-slate-900 bg-slate-200/60 border-l border-slate-300 whitespace-nowrap transition-colors ${
                    onClick ? "cursor-pointer hover:bg-slate-200" : ""
                  }`}
                  onClick={onClick}
                >
                  {cell?.formattedValue ?? "—"}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
