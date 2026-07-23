import { useEffect, useMemo, useState } from "react";
import { DatePicker, Spin } from "antd";
import {
  CheckCircle2,
  Database,
  LayoutGrid,
  TrendingUp,
  Users,
} from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import { targetReportApi } from "../../api/targetReportApi";
import type { DepartmentTargetResponse } from "../../types/targetReport";

interface FlatRow {
  deptName: string;
  indName: string;
  unit: string;
  khThang: number;
  thucHien: number;
  luyKe: number;
  pct: number;
}

interface Props {
  selectedPeriod: Dayjs;
}

export function TargetSummary({ selectedPeriod }: Props) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => {
    const today = dayjs();
    if (today.format("YYYY-MM") === selectedPeriod.format("YYYY-MM")) {
      return today;
    }
    return selectedPeriod.startOf("month");
  });

  const [allData, setAllData] = useState<DepartmentTargetResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Reset selectedDate when selectedPeriod changes
  useEffect(() => {
    const startOfMonth = selectedPeriod.startOf("month");
    const today = dayjs();
    if (today.format("YYYY-MM") === selectedPeriod.format("YYYY-MM")) {
      setSelectedDate(today);
    } else {
      setSelectedDate(startOfMonth);
    }
  }, [selectedPeriod]);

  // Fetch all department summary for the selected date
  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    setLoading(true);
    const dateParam = selectedDate.format("YYYY-MM-DD");
    targetReportApi
      .getAll(dateParam)
      .then((res) => {
        if (!cancelled) setAllData(res ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Step3: failed to load summary:", err);
          setAllData([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  // Flatten the response into rows for the table
  const rows = useMemo<FlatRow[]>(() => {
    const result: FlatRow[] = [];
    const flattenReports = (list: DepartmentTargetResponse[]) => {
      list.forEach((dept) => {
        (dept.targetReportResponseList ?? []).forEach((r) => {
          const khThang = r.value ?? 0;
          const thucHien = r.performDone ?? 0;
          const luyKe = r.monthLyCumulative ?? 0;
          const pct = Number(r.donePercent ?? 0);
          result.push({
            deptName: dept.departmentName ?? "",
            indName: r.targetName ?? "",
            unit: r.unit ?? "",
            khThang,
            thucHien,
            luyKe,
            pct,
          });
        });
        if (dept.children?.length) flattenReports(dept.children);
      });
    };
    flattenReports(allData);
    return result;
  }, [allData]);

  // KPI totals
  const kpis = useMemo(() => {
    const totKh = rows.reduce((s, r) => s + r.khThang, 0);
    const totTh = rows.reduce((s, r) => s + r.luyKe, 0);
    return {
      totKh,
      totTh,
      pct: totKh ? Math.round((totTh / totKh) * 100) : 0,
      count: rows.length,
    };
  }, [rows]);

  const KPI_DEFS = [
    {
      label: "Tổng kế hoạch tháng",
      val: (kpis.totKh),
      sub: "Kế hoạch toàn kỳ",
      icon: <Database size={16} />,
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Tổng lũy kế thực hiện",
      val: (kpis.totTh),
      sub: `Lũy kế đến ngày ${selectedDate.format("DD/MM/YYYY")}`,
      icon: <TrendingUp size={16} />,
      color: "text-[#1a8649] bg-emerald-50",
    },
    {
      label: "Tỷ lệ hoàn thành",
      val: `${kpis.pct}%`,
      sub: "Mức độ đạt mục tiêu",
      icon: <CheckCircle2 size={16} />,
      color: "text-emerald-700 bg-emerald-100/50",
    },
    {
      label: "Số chỉ tiêu",
      val: (kpis.count),
      sub: "Chỉ tiêu đang theo dõi",
      icon: <Users size={16} />,
      color: "text-cyan-600 bg-cyan-50",
    },
  ];

  return (
    <div className="flex-1 overflow-hidden flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {KPI_DEFS.map((kpi, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(15,23,42,0.02)]"
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {kpi.label}
              </span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${kpi.color}`}
              >
                {kpi.icon}
              </div>
            </div>
            <div className="mt-3">
              <div className="font-mono font-bold text-xl text-slate-800 leading-none">
                {kpi.val}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 font-medium">
                {kpi.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
          <span className="font-bold text-xs text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
            <LayoutGrid size={14} className="text-[#1a8649]" /> BẢNG TỔNG HỢP
            TOÀN ĐƠN VỊ
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">Ngày tổng hợp:</span>
            <DatePicker
              size="small"
              value={selectedDate}
              onChange={(date) => {
                if (date) setSelectedDate(date);
              }}
              format="DD/MM/YYYY"
              allowClear={false}
              disabledDate={(current) => {
                return (
                  current.month() !== selectedPeriod.month() ||
                  current.year() !== selectedPeriod.year()
                );
              }}
            />
            {loading && <Spin size="small" />}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                {["Bộ phận / Phân xưởng", "Chỉ tiêu", "ĐVT", "KH Tháng", "Thực hiện ngày", "Lũy kế", "% Đạt"].map(
                  (h, i) => (
                    <th
                      key={i}
                      className={`p-3 ${i >= 3 ? "text-right" : ""} ${i === 6 ? "text-center" : ""}`}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Spin />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-400 font-medium"
                  >
                    Không có dữ liệu tổng hợp cho ngày này.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => {
                  const pctColor =
                    row.pct >= 95
                      ? "bg-emerald-50 text-emerald-700"
                      : row.pct >= 80
                        ? "bg-orange-50 text-orange-700"
                        : "bg-red-50 text-red-700";
                  return (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 hover:bg-slate-50/40 transition-all"
                    >
                      <td className="p-3 font-semibold text-slate-500">
                        {row.deptName}
                      </td>
                      <td className="p-3 font-semibold text-slate-700">
                        {row.indName}
                      </td>
                      <td className="p-3 text-center text-slate-400 font-bold uppercase">
                        {row.unit}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-800">
                        {(row.khThang)}
                      </td>
                      <td className="p-3 text-right font-mono font-semibold text-slate-600">
                        {(row.thucHien)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-[#1a8649]">
                        {(row.luyKe)}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${pctColor}`}
                        >
                          {Number(row.pct).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
