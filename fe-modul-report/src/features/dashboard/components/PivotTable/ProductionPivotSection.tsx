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
// ─── Chart helpers ────────────────────────────────────────────────────────────
interface ChartRow {
  thang: string;
  type: "Kế hoạch" | "Thực hiện";
  value: number;
  chiTieu: string;
}

export function ProductionPivotSection() {
  const [selectedChiTieu, setSelectedChiTieu] =
    useState<string>("Than NK sản xuất");

  // Transform mock data for the chart
  const chartData: ChartRow[] = useMemo(() => {
    const rows: ChartRow[] = [];
    PRODUCTION_MOCK.filter((r) => r.chiTieu === selectedChiTieu).forEach(
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
  }, [selectedChiTieu]);

  // Available chỉ tiêu for chart filter
  const chiTieuList = useMemo(() => {
    return Array.from(new Set(PRODUCTION_MOCK.map((r) => r.chiTieu)));
  }, []);

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
        data={PRODUCTION_MOCK as unknown as Record<string, unknown>[]}
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
