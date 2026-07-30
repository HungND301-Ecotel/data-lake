import { useState, useMemo, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { Column } from "@ant-design/charts";
import { PivotTable } from "./PivotTable";
import {
  AVAILABLE_ROW_FIELDS,
  AVAILABLE_COLUMN_FIELDS,
  AVAILABLE_VALUE_FIELDS,
} from "./pivotConfig";
import type { DepartmentTargetResponse, TargetReportResponse } from "../../types/targetReport";
import dayjs from "dayjs";
import { targetReportApi } from "../../api/targetReportApi";
import { targetApi } from "../../api/targetApi";

// ─── Chart helpers ────────────────────────────────────────────────────────────
interface ChartRow {
  thang: string;
  type: "Kế hoạch" | "Thực hiện";
  value: number;
  chiTieu: string;
}

interface PivotRecord {
  id: string;
  chiTieu: string;
  donVi: string;
  thang: string;
  thangNum: number;
  keHoach: number;
  thucHien: number;
  phanXuong: string;
}

interface Props {
  targetData?: DepartmentTargetResponse[];
  selectedDate?: string;
}

export function ProductionPivotSection({ selectedDate }: Props) {
  const [selectedChiTieu, setSelectedChiTieu] = useState<string>("");
  const [monthlyData, setMonthlyData] = useState<PivotRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    const base = selectedDate ? dayjs(selectedDate) : dayjs();
    const currentMonth = base.month() + 1; // 1-based
    const year = base.year();
    const today = dayjs();

    const monthsToFetch = Array.from(
      { length: Math.min(currentMonth, 12) },
      (_, i) => i + 1,
    );

    Promise.all(
      monthsToFetch.map(async (m) => {
        const monthStr = `${year}-${String(m).padStart(2, "0")}`;
        const targets = await targetApi.getTargets(undefined, monthStr);
        if (!targets || targets.length === 0) return [];

        let reportDateStr: string;
        if (m === currentMonth && year === today.year()) {
          reportDateStr = base.isAfter(today, "day")
            ? today.format("YYYY-MM-DD")
            : base.format("YYYY-MM-DD");
        } else {
          reportDateStr = dayjs(`${monthStr}-01`).endOf("month").format("YYYY-MM-DD");
        }

        const reports = await targetReportApi.getAll(reportDateStr);

        const reportMap = new Map<string, { performDone: number; luyKe: number }>();

        const processTargetReportNode = (r: TargetReportResponse): { luyKe: number; performDone: number } => {
          let luyKe = (r.monthLyCumulative != null && r.monthLyCumulative > 0)
            ? r.monthLyCumulative + (r.performDone ?? 0)
            : (r.performDone ?? 0);
          let perform = r.performDone ?? 0;

          if (r.children && r.children.length > 0) {
            let childLuyKeSum = 0;
            let childPerformSum = 0;
            r.children.forEach((c: TargetReportResponse) => {
              const childRes = processTargetReportNode(c);
              childLuyKeSum += childRes.luyKe;
              childPerformSum += childRes.performDone;
            });
            if (luyKe === 0) luyKe = childLuyKeSum;
            if (perform === 0) perform = childPerformSum;
          }

          reportMap.set(r.targetId, { luyKe, performDone: perform });
          return { luyKe, performDone: perform };
        };

        const walkReports = (deptList: DepartmentTargetResponse[]) => {
          deptList.forEach((dept) => {
            (dept.targetReportResponseList ?? []).forEach((r) => {
              processTargetReportNode(r);
            });
            if (dept.children?.length) walkReports(dept.children);
          });
        };
        walkReports(reports ?? []);

        return targets.map((t, idx) => {
          const rep = reportMap.get(t.id);
          const thucHienVal = (rep?.luyKe && rep.luyKe > 0) ? rep.luyKe : (rep?.performDone ?? 0);
          return {
            id: `${t.id}-${m}-${idx}`,
            chiTieu: t.name,
            donVi: t.unit || "-",
            thang: `T${m}/${year}`,
            thangNum: m,
            keHoach: t.value ?? 0,
            thucHien: thucHienVal,
            phanXuong: t.departmentName || "Bộ phận",
          };
        });
      }),
    )
      .then((results) => {
        if (!cancelled) {
          setMonthlyData(results.flat());
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load monthly pivot data:", err);
          setMonthlyData([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const pivotData = monthlyData;

  // Transform data for the chart
  const chartData: ChartRow[] = useMemo(() => {
    const rows: ChartRow[] = [];
    pivotData
      .filter((r) => r.chiTieu === selectedChiTieu)
      .forEach((r) => {
        rows.push({
          thang: r.thang,
          type: "Kế hoạch",
          value: r.keHoach,
          chiTieu: r.chiTieu,
        });
        rows.push({
          thang: r.thang,
          type: "Thực hiện",
          value: r.thucHien,
          chiTieu: r.chiTieu,
        });
      });
    return rows;
  }, [selectedChiTieu, pivotData]);

  // Available chỉ tiêu for chart filter
  const chiTieuList = useMemo(() => {
    return Array.from(new Set(pivotData.map((r) => r.chiTieu)));
  }, [pivotData]);

  useEffect(() => {
    if (chiTieuList.length > 0 && !chiTieuList.includes(selectedChiTieu)) {
      setSelectedChiTieu(chiTieuList[0]);
    }
  }, [chiTieuList, selectedChiTieu]);

  const chartConfig = {
    data: chartData,
    xField: "thang",
    yField: "value",
    colorField: "type",
    group: true,
    color: ["#3b82f6", "#10b981"],
    columnStyle: { radius: [4, 4, 0, 0] },
    legend: { position: "top-right" as const },
    axis: {
      y: {
        labelFormatter: (v: number) =>
          new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(v),
      },
    },
    tooltip: {
      formatter: (datum: { type: string; value: number }) => ({
        name: datum.type,
        value: new Intl.NumberFormat("vi-VN").format(datum.value),
      }),
    },
    interactions: [{ type: "element-highlight" }],
    animation: {
      appear: { animation: "scale-in-y", duration: 600 },
    },
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ─── Section Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Kết quả sản xuất
          </h2>
        </div>
      </div>

      {/* ─── PivotTable ─────────────────────────────────────────── */}
      <PivotTable
        data={pivotData as unknown as Record<string, unknown>[]}
        rowField={AVAILABLE_ROW_FIELDS[0]}
        columnField={AVAILABLE_COLUMN_FIELDS[0]}
        valueFields={AVAILABLE_VALUE_FIELDS}
        aggregation="sum"
        availableRowFields={AVAILABLE_ROW_FIELDS}
        availableColumnFields={AVAILABLE_COLUMN_FIELDS}
        availableValueFields={AVAILABLE_VALUE_FIELDS}
        enableDrilldown
        title="Kết quả sản xuất hôm nay và Lũy kế"
        showToolbar
        showConfig
        maxHeight={520}
      />

      {/* ─── Chart Section ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-emerald-600" />
            <span className="font-bold text-base text-slate-900">
              Biểu đồ so sánh Kế hoạch vs Thực hiện
            </span>
          </div>
          {/* Chỉ tiêu filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {chiTieuList.map((ct) => (
              <button
                key={ct}
                onClick={() => setSelectedChiTieu(ct)}
                className={`text-xs font-semibold px-3 py-1 rounded-full border transition-all ${
                  selectedChiTieu === ct
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {ct}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <Column {...chartConfig} height={280} />
        </div>
      </div>
    </div>
  );
}
