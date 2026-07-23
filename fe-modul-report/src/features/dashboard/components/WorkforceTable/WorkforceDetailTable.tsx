import { useState, useEffect, useMemo } from "react";
import { AlertCircle, ChevronDown, ClipboardList, Loader2 } from "lucide-react";
import dayjs from "dayjs";
import { flattenWorkforceRows, fmtWf } from "./workforceTable.utils";
import { workforceApi } from "../../api/workforceApi";
import type {
  WorkforceDetailTableProps,
  WorkforceRow,
} from "../../types/workforce";

// Helper to pre-calculate which row IDs have children or shifts to check hasChildren
const getRowsWithExpandable = (rows: WorkforceRow[]): Set<string> => {
  const ids = new Set<string>();
  const traverse = (items: WorkforceRow[]) => {
    for (const item of items) {
      const hasChildren =
        (item.children && item.children.length > 0) ||
        (item.shifts && item.shifts.length > 0);
      if (hasChildren) {
        ids.add(item.id);
      }
      if (item.children && item.children.length > 0) {
        traverse(item.children);
      }
    }
  };
  traverse(rows);
  return ids;
};

const WorkforceTableLoading = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
      <span className="text-sm font-medium text-slate-600">
        Đang tải dữ liệu...
      </span>
    </div>
  );
};

const WorkforceTableEmpty = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
        <ClipboardList className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700 mb-1">
        Không có dữ liệu
      </h3>
      <p className="text-xs text-slate-500 max-w-xs">
        Không có dữ liệu báo cáo nhân lực
      </p>
    </div>
  );
};

export default function WorkforceDetailTable({
  date,
  departmentId,
  reportDate: propReportDate,
  data: propData,
  loading: propLoading,
}: WorkforceDetailTableProps) {
  // ponytail: merged fetching & error handling directly into WorkforceDetailTable
  const [data, setData] = useState<WorkforceRow[]>(propData ?? []);
  const [loading, setLoading] = useState<boolean>(
    propLoading ?? (propData ? false : true),
  );
  const [error, setError] = useState<Error | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (propData !== undefined) {
      setData(propData);
      setLoading(propLoading ?? false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    workforceApi
      .getWorkforceTree(date, departmentId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [date, departmentId, propData, propLoading]);

  const reportDate =
    propReportDate || (date ? dayjs(date).format("DD/MM/YYYY") : "");

  if (error) {
    return (
      <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-800 my-4 animate-fadeIn">
        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Lỗi tải dữ liệu</span>
          <span className="text-xs text-rose-600 mt-0.5">
            {error.message ||
              "Không thể lấy dữ liệu báo cáo nhân lực. Vui lòng thử lại."}
          </span>
        </div>
      </div>
    );
  }

  const toggleCollapse = (id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Identify all department rows that have expandable details (either shifts or child departments)
  const rowsWithExpandable = useMemo(() => getRowsWithExpandable(data), [data]);

  // Flatten the recursive workforce tree into a flat list for row-by-row rendering
  const flatRows = useMemo(() => {
    const flattened = flattenWorkforceRows(data, collapsedIds);
    return flattened.map((r) => ({
      ...r,
      collapsed: collapsedIds.has(r.id),
      hasChildren: rowsWithExpandable.has(r.id),
    }));
  }, [data, collapsedIds, rowsWithExpandable]);

  const getRowClassName = (row: (typeof flatRows)[number]) => {
    let classes =
      "border-b border-slate-100 hover:bg-slate-50/40 transition-colors ";
    if (row.isTotal) {
      classes +=
        "bg-red-50/20 text-red-700 font-bold border-y border-red-100/70";
    } else if (row.highlight) {
      classes +=
        "bg-amber-50/70 text-amber-900 border-l-4 border-amber-500 font-semibold";
    } else if (row.isShift) {
      classes += "text-slate-500 bg-slate-50/30 font-medium italic";
    } else {
      classes += "text-slate-700";
    }
    return classes;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            Bảng công nhân lực chi tiết
          </h2>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100">
            Báo cáo phân cấp
          </span>
        </div>
        {reportDate && (
          <span className="text-sm text-slate-500 font-medium">
            Ngày báo cáo: {reportDate}
          </span>
        )}
      </div>

      {/* Table Wrapper */}
      {loading ? (
        <WorkforceTableLoading />
      ) : data.length === 0 ? (
        <WorkforceTableEmpty />
      ) : (
        <div className="overflow-x-auto px-6 pb-6 pt-3">
          <table className="min-w-[1100px] w-full border-collapse">
            <thead className="bg-slate-50/50">
              <tr>
                <th
                  rowSpan={2}
                  className="p-3 text-left font-sans font-bold text-slate-800 tracking-tight border border-slate-100 min-w-[280px]"
                >
                  Bộ phận/Ca
                </th>
                <th
                  rowSpan={2}
                  className="p-3 text-center font-sans font-bold bg-slate-100/70 text-slate-900 border border-slate-100 min-w-[95px]"
                >
                  Tổng nhân lực
                </th>
                <th
                  colSpan={4}
                  className="p-2 text-center font-sans font-bold bg-emerald-50/40 text-emerald-800 border border-slate-100"
                >
                  Nhân lực đi làm trong ngày{" "}
                </th>
                <th
                  colSpan={6}
                  className="p-2 text-center font-sans font-bold bg-rose-50/40 text-rose-800 border border-slate-100"
                >
                  Nhân lực vắng mặt trong ngày
                </th>
                <th
                  rowSpan={2}
                  className="p-3 text-center font-sans font-bold text-rose-600 border border-slate-100"
                >
                  T.lò vắng mặt trong ngày
                </th>
              </tr>
              <tr>
                {/* Under Đi làm */}
                <th className="p-2 text-center font-sans font-bold bg-emerald-50/20 text-emerald-700 border border-slate-100">
                  Tổng
                </th>
                <th className="p-2 text-center font-sans font-semibold text-slate-700 border border-slate-100">
                  Thợ lò đi làm
                </th>
                <th className="p-2 text-center font-sans font-semibold text-slate-700 border border-slate-100">
                  Cơ điện (khối HL), CĐ <br /> LĐ khác (khối MB)
                </th>

                <th className="p-2 text-center font-sans font-semibold text-slate-700 border border-slate-100">
                  Quản lý Phục vụ
                </th>
                {/* Under Vắng mặt */}
                <th className="p-2 text-center font-sans font-bold bg-rose-50/20 text-rose-700 border border-slate-100">
                  Tổng
                </th>
                <th className="p-2 text-center font-sans font-semibold text-slate-700 border border-slate-100">
                  Ô
                </th>
                <th className="p-2 text-center font-sans font-semibold text-slate-700 border border-slate-100">
                  P
                </th>
                <th className="p-2 text-center font-sans font-semibold text-slate-700 border border-slate-100">
                  TT
                </th>
                <th className="p-2 text-center font-sans font-semibold text-slate-700 border border-slate-100">
                  H
                </th>
                <th className="p-2 text-center font-sans font-semibold text-slate-700 border border-slate-100">
                  V
                </th>
              </tr>
            </thead>
            <tbody>
              {flatRows.map((row) => {
                const isTLoVangAlert = row.tLoVang > 0;
                return (
                  <tr key={row.id} className={getRowClassName(row)}>
                    {/* Cột Bộ phận/Ca */}
                    <td className="p-3 text-left border border-slate-100 font-sans">
                      <div
                        className="flex items-center gap-2"
                        style={{ paddingLeft: `${row.level * 16 + 12}px` }}
                      >
                        {row.hasChildren && !row.isShift ? (
                          <button
                            onClick={() => toggleCollapse(row.id)}
                            className="p-1 hover:bg-slate-200/60 rounded text-slate-500 transition-colors inline-flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            style={{ width: "24px", height: "24px" }}
                          >
                            <ChevronDown
                              className={`w-4 h-4 transition-transform duration-200 ${
                                row.collapsed ? "-rotate-90" : ""
                              }`}
                            />
                          </button>
                        ) : (
                          <div className="w-6 h-6 flex-shrink-0" />
                        )}
                        <span className="truncate">{row.ten}</span>
                      </div>
                    </td>

                    {/* Cột Tổng nhân lực */}
                    <td className="p-2 text-center border border-slate-100 font-mono tabular-nums text-sm font-bold text-slate-900 bg-slate-50/40">
                      {fmtWf(row.tongNhanLuc)}
                    </td>

                    {/* Numbers columns */}
                    <td className="p-2 text-center border border-slate-100 font-mono tabular-nums text-sm">
                      {fmtWf(row.diLamTong)}
                    </td>
                    <td className="p-2 text-center border border-slate-100 font-mono tabular-nums text-sm">
                      {fmtWf(row.diLamThoLo)}
                    </td>
                    <td className="p-2 text-center border border-slate-100 font-mono tabular-nums text-sm">
                      {fmtWf(row.diLamCoDien)}
                    </td>
                    <td className="p-2 text-center border border-slate-100 font-mono tabular-nums text-sm">
                      {fmtWf(row.diLamQlpv)}
                    </td>

                    <td className="p-2 text-center border border-slate-100 font-mono tabular-nums text-sm">
                      {fmtWf(row.vangTong)}
                    </td>
                    <td className="p-2 text-center border border-slate-100 font-mono tabular-nums text-sm">
                      {fmtWf(row.vangO)}
                    </td>
                    <td className="p-2 text-center border border-slate-100 font-mono tabular-nums text-sm">
                      {fmtWf(row.vangP)}
                    </td>
                    <td className="p-2 text-center border border-slate-100 font-mono tabular-nums text-sm">
                      {fmtWf(row.vangTt)}
                    </td>
                    <td className="p-2 text-center border border-slate-100 font-mono tabular-nums text-sm">
                      {fmtWf(row.vangH)}
                    </td>
                    <td className="p-2 text-center border border-slate-100 font-mono tabular-nums text-sm">
                      {fmtWf(row.vangV)}
                    </td>

                    {/* T.lò vắng */}
                    <td
                      className={`p-2 text-center border border-slate-100 font-mono tabular-nums text-sm ${
                        isTLoVangAlert ? "text-rose-600 font-bold" : ""
                      }`}
                    >
                      {fmtWf(row.tLoVang)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
