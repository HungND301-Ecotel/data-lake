import { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { Column } from "@ant-design/charts";
import { PivotTable } from "./PivotTable";
import {
  PRODUCTION_MOCK,
  AVAILABLE_ROW_FIELDS,
  AVAILABLE_COLUMN_FIELDS,
  AVAILABLE_VALUE_FIELDS,
} from "./mockData";
import type { DepartmentTargetResponse } from "../../types/targetReport";
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

// ponytail: same shape as PRODUCTION_MOCK so PivotTable works unchanged
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

export function ProductionPivotSection({ targetData, selectedDate }: Props) {
  const [selectedChiTieu, setSelectedChiTieu] =
    useState<string>("Than NK sản xuất");

  // ponytail: build pivot data from real API — fetch past months' lũy kế
  const [monthlyData, setMonthlyData] = useState<PivotRecord[]>([]);

  // ponytail: on mount or when selectedDate changes, fetch 6 months of data
  useMemo(() => {
    if (!selectedDate) return;
    const base = dayjs(selectedDate);
    const currentMonth = base.month() + 1; // 1-based
    const year = base.year();
    // ponytail: fetch months 1..currentMonth in parallel
    const monthsToFetch = Array.from({ length: Math.min(currentMonth, 6) }, (_, i) => i + 1);

    Promise.all(
      monthsToFetch.map(async (m) => {
        const monthStr = `${year}-${String(m).padStart(2, "0")}`;
        // Get targets (KH) for this month
        const targets = await targetApi.getTargets("", monthStr);
        // Get last day of month to get lũy kế
        const lastDay = dayjs(`${monthStr}-01`).endOf("month").format("YYYY-MM-DD");
        const reports = await targetReportApi.getAll(lastDay);

        // ponytail: flatten reports into a lookup by targetId
        const reportMap = new Map<string, { performDone: number; luyKe: number }>();
        for (const dept of reports) {
          for (const r of dept.targetReportResponseList ?? []) {
            const existing = reportMap.get(r.targetId);
            if (existing) {
              existing.luyKe += r.monthLyCumulative ?? 0;
            } else {
              reportMap.set(r.targetId, {
                performDone: r.performDone ?? 0,
                luyKe: r.monthLyCumulative ?? 0,
              });
            }
          }
        }

        return targets.map((t, idx) => ({
          id: `real-${m}-${idx}`,
          chiTieu: t.name,
          donVi: t.unit,
          thang: `T${m}/${year}`,
          thangNum: m,
          keHoach: t.value,
          thucHien: reportMap.get(t.id)?.luyKe ?? 0,
          phanXuong: t.departmentName ?? "",
        }));
      })
    )
      .then((results) => setMonthlyData(results.flat()))
      .catch((err) => console.error("Failed to load monthly pivot data:", err));
  }, [selectedDate]);

  // ponytail: use real data if available, fallback to mock
  const pivotData = monthlyData.length > 0 ? monthlyData : PRODUCTION_MOCK;

  // Transform data for the chart
  const chartData: ChartRow[] = useMemo(() => {
    const rows: ChartRow[] = [];
    (pivotData as PivotRecord[]).filter((r) => r.chiTieu === selectedChiTieu).forEach(
      (r) => {
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
      },
    );
    return rows;
  }, [selectedChiTieu, pivotData]);

  // Available chỉ tiêu for chart filter
  const chiTieuList = useMemo(() => {
    return Array.from(new Set((pivotData as PivotRecord[]).map((r) => r.chiTieu)));
  }, [pivotData]);

  // ponytail: auto-select first chiTieu when data changes
  useMemo(() => {
    if (chiTieuList.length > 0 && !chiTieuList.includes(selectedChiTieu)) {
      setSelectedChiTieu(chiTieuList[0]);
    }
  }, [chiTieuList]);

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
