import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, InputNumber, Tag, Spin, message, DatePicker } from "antd";
import { CalendarDays } from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import { targetReportApi } from "../../api/targetReportApi";
import type { TargetResponse } from "../../types/target";
import type {
  TargetReportRequest,
  TargetReportResponse,
} from "../../types/targetReport";

interface DayEntry {
  id: string | null;
  productionOrderId: number | null;
  productionDate: string;
  shiftDone: number;
  performDone: number | null;
}

const toEntry = (r: TargetReportResponse): DayEntry => ({
  id: r.id ?? null,
  productionOrderId: r.productionOrderId ?? null,
  productionDate: r.productionDate,
  shiftDone: r.shiftDone ?? 0,
  performDone: r.performDone ?? null,
});

// ── StatGrid ─────────────────────────────────────────────────────
interface StatGridProps {
  target: TargetResponse;
  targets: TargetResponse[];
  existing?: TargetReportResponse;
}
function StatGrid({ target, existing }: StatGridProps) {
  const kh = existing?.value ?? target.value ?? 0;
  const days = dayjs(target.month).daysInMonth();
  const bqNgKH = existing?.targetPerDay ?? (days ? kh / days : 0);
  const lk = existing?.monthLyCumulative ?? 0;
  const pct = existing?.donePercent ?? 0;
  const caConLai = existing?.shiftRemain ?? 0;
  const bqNgConLai = existing?.targetPerDayRemain ?? 0;

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5  text-slate-500">
      <div>
        KH Tháng: <span className="font-semibold text-slate-800">{kh}</span>
      </div>
      <div>
        BQ Ngày KH:{" "}
        <span className="font-semibold text-slate-800">
          {Math.round(Number(bqNgKH))}
        </span>
      </div>
      <div>
        Lũy kế TH:{" "}
        <span className="font-semibold text-teal-700">{Number(lk)}</span>
      </div>
      <div>
        % Đạt KH:{" "}
        <span className="font-bold text-[#1a8649]">
          {Number(pct).toFixed(1)}%
        </span>
      </div>
      <div>
        Ngày còn lại:{" "}
        <span className="font-semibold text-slate-800">{caConLai} ca</span>
      </div>
      <div>
        BQ Ngày còn lại:{" "}
        <span className="font-semibold text-orange-700">
          {Math.round(Number(bqNgConLai))}
        </span>
      </div>
    </div>
  );
}
interface IndicatorCardProps {
  target: TargetResponse;
  targets: TargetResponse[];
  isParent: boolean;
  dayValues: DayEntry;
  existing?: TargetReportResponse;
  onChangeField: (field: keyof DayEntry, val: any) => void;
}
function IndicatorCard({
  target,
  targets,
  isParent,
  dayValues,
  existing,
  onChangeField,
}: IndicatorCardProps) {
  if (isParent) {
    return (
      <div className="bg-slate-50/60 border border-slate-100 rounded-lg p-3.5 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{target.name}</span>
            {target.code && (
              <span className="text-[10px] text-slate-400 font-mono">
                ({target.code})
              </span>
            )}
          </div>
          <Tag
            color="processing"
            className="m-0 text-[9px] font-semibold uppercase"
          >
            {target.unit}
          </Tag>
        </div>
        <div className="bg-white border border-slate-100 rounded p-2.5">
          <StatGrid target={target} targets={targets} existing={existing} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-col gap-3.5 hover:border-slate-300 transition-all">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800">{target.name}</span>
          {target.code && (
            <span className="text-[10px] text-slate-400 font-mono">
              ({target.code})
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">
          Biện pháp / LSX
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400">Số</label>
            <InputNumber
              size="small"
              className="w-full"
              min={0}
              value={dayValues.productionOrderId}
              placeholder="Số LSX"
              onChange={(val) =>
                onChangeField("productionOrderId", val ?? null)
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-400">Ngày tháng</label>
            <DatePicker
              size="small"
              className="w-full"
              format="DD/MM/YYYY"
              value={
                dayValues.productionDate
                  ? dayjs(dayValues.productionDate)
                  : null
              }
              onChange={(d) =>
                onChangeField("productionDate", d ? d.format("YYYY-MM-DD") : "")
              }
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500 uppercase">
          Thực hiện ngày
        </label>
        <InputNumber
          size="small"
          className="w-full"
          value={dayValues.performDone}
          placeholder="Sản lượng"
          onChange={(val) => onChangeField("performDone", val ?? null)}
        />
      </div>

      <div className="border-t border-slate-100 pt-2.5">
        <StatGrid target={target} targets={targets} existing={existing} />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
interface Props {
  selectedWorkshop: string;
  selectedPeriod: Dayjs;
}

export function TargetMonthCalendar({
  selectedWorkshop,
  selectedPeriod,
}: Props) {
  const [targets, setTargets] = useState<TargetResponse[]>([]);
  const [existingReports, setExistingReports] = useState<
    TargetReportResponse[]
  >([]);
  const [dailyData, setDailyData] = useState<Record<string, DayEntry>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditingDay, setIsEditingDay] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() =>
    selectedPeriod.startOf("month"),
  );
  const [savedDates, setSavedDates] = useState<Set<string>>(new Set());
  useEffect(() => {
    setSelectedDate(selectedPeriod.startOf("month"));
    setIsEditingDay(false);
    setDailyData({});
  }, [selectedPeriod.format("YYYY-MM")]);
  // ── Init savedDates cho cả tháng ─────────────────────────────
  useEffect(() => {
    if (!selectedWorkshop) return;
    const monthStr = selectedPeriod.startOf("month").format("YYYY-MM-DD");
    targetReportApi
      .getDatesInMonth(selectedWorkshop, monthStr)
      .then((dates) => setSavedDates(new Set(dates)))
      .catch(console.error);
  }, [selectedWorkshop, selectedPeriod]);

  // ── Fetch khi chọn ngày ───────────────────────────────────────
  useEffect(() => {
    if (!selectedWorkshop || !selectedDate) return;
    const dateStr = selectedDate.format("YYYY-MM-DD");
    let cancelled = false;
    setLoading(true);

    targetReportApi
      .getTargetReportByDepartmentAndMonth(selectedWorkshop, dateStr)
      .then((res) => {
        if (cancelled) return;
        const reports = res ?? [];

        const flatTargets: TargetResponse[] = [];
        const flatRepList: TargetReportResponse[] = [];
        const initialDailyData: Record<string, DayEntry> = {};

        const walk = (
          nodes: TargetReportResponse[],
          parentId: string | null,
        ) => {
          nodes.forEach((node) => {
            flatRepList.push(node);
            initialDailyData[node.targetId] = toEntry(node);
            flatTargets.push({
              id: node.targetId,
              name: node.targetName ?? "",
              code: node.code ?? "",
              unit: node.unit ?? "",
              value: node.value ? Number(node.value) : 0,
              month: selectedDate.format("YYYY-MM"),
              departmentId: selectedWorkshop,
              parentId,
            });
            if (node.children?.length)
              walk(node.children as any, node.targetId);
          });
        };
        walk(reports, null);

        setTargets(flatTargets);
        setExistingReports(flatRepList);
        setDailyData(initialDailyData);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Step2 fetch error:", err);
        setTargets([]);
        setExistingReports([]);
        setDailyData({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedWorkshop, selectedDate]);

  // ── Save ──────────────────────────────────────────────────────
  const handleConfirmSave = useCallback(async () => {
    if (Object.keys(dailyData).length === 0) {
      message.warning("Chưa có dữ liệu để lưu!");
      return;
    }

    const dateStr = selectedDate.format("YYYY-MM-DD");
    const reqs: TargetReportRequest[] = Object.entries(dailyData).map(
      ([targetId, entry]) => {
        const hasInput =
          (entry.performDone != null && entry.performDone > 0) ||
          entry.productionOrderId != null;
        return {
          id: entry.id ?? null,
          date: dateStr,
          targetId,
          productionOrderId: entry.productionOrderId ?? null,
          productionDate: entry.productionDate || dateStr,
          shiftDone: hasInput ? 1 : 0,
          performDone: entry.performDone ?? 0,
        };
      },
    );
    const isFirstCreate = reqs.some((r) => !r.id);

    setSaving(true);
    try {
      if (isFirstCreate) {
        await targetReportApi.createBulk(reqs);
      } else {
        await targetReportApi.updateBulk(reqs);
      }

      setSavedDates((prev) => new Set([...prev, dateStr]));
      setIsEditingDay(false);
      message.success("Lưu dữ liệu ngày thành công!");
    } catch (err) {
      console.error(err);
      message.error("Lưu thất bại!");
    } finally {
      setSaving(false);
    }
  }, [dailyData, selectedDate]);
  // ── Cancel ────────────────────────────────────────────────────
  const handleCancel = useCallback(() => {
    setIsEditingDay(false);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────
  const handleChange = useCallback(
    (targetId: string, field: keyof DayEntry, val: any) => {
      const dateStr = selectedDate.format("YYYY-MM-DD");
      setDailyData((prev) => {
        const entry = prev[targetId] || {
          id: null,
          productionOrderId: null,
          productionDate: dateStr,
          shiftDone: 0,
          performDone: null,
        };
        return { ...prev, [targetId]: { ...entry, [field]: val } };
      });
    },
    [selectedDate],
  );

  const handleDateSelect = useCallback(
    (date: Dayjs) => {
      if (
        date.month() === selectedPeriod.month() &&
        date.year() === selectedPeriod.year()
      ) {
        setSelectedDate(date);
        setIsEditingDay(true);
      }
    },
    [selectedPeriod],
  );

  const dateCellRender = useCallback(
    (current: Dayjs) => {
      const isCurrentMonth =
        current.month() === selectedPeriod.month() &&
        current.year() === selectedPeriod.year();
      if (!isCurrentMonth) return null;

      const dateKey = current.format("YYYY-MM-DD");
      const hasSavedData = savedDates.has(dateKey);
      const isSelected = current.isSame(selectedDate, "day") && isEditingDay;

      return (
        <div
          className={`h-full w-full p-1.5 flex items-start border rounded-lg transition-all min-h-[40px] lg:min-h-[55px]
            ${hasSavedData ? "bg-teal-50/70 border-teal-200" : "bg-white border-slate-100"}
            ${isSelected ? "ring-2 ring-[#1a8649] ring-offset-1 border-transparent shadow-sm" : ""}
          `}
        >
          {hasSavedData && (
            <span className="w-1.5 h-1.5 rounded-full bg-teal-600 inline-block mt-0.5" />
          )}
        </div>
      );
    },
    [savedDates, selectedDate, selectedPeriod, isEditingDay],
  );

  const isValid = useMemo(() => {
    if (targets.length === 0) return false;
    const leafTargets = targets.filter(
      (target) => !targets.some((t) => t.parentId === target.id),
    );
    if (leafTargets.length === 0) return false;
    return leafTargets.every((target) => {
      const entry = dailyData[target.id];
      if (!entry) return false;
      return (
        entry.productionOrderId != null &&
        entry.productionOrderId > 0 &&
        entry.performDone != null &&
        entry.performDone > 0 &&
        entry.productionDate != null &&
        entry.productionDate !== ""
      );
    });
  }, [targets, dailyData]);

  const dateStr = selectedDate.format("YYYY-MM-DD");

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row gap-6">
      {/* Calendar */}
      <div className="flex-none lg:flex-1 min-h-[380px] lg:min-h-0 bg-white rounded-xl border border-slate-200 p-5 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-[#1a8649]" />
            <h2 className="text-xs font-bold text-slate-700 uppercase">
              Lịch tháng: {selectedPeriod.format("[Tháng] MM/YYYY")}
            </h2>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-semibold">
            {loading && <Spin size="small" />}
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded inline-block bg-slate-100 border border-slate-200" />{" "}
              Chưa nhập
            </span>
            <span className="flex items-center gap-1.5 text-teal-800">
              <span className="w-2.5 h-2.5 rounded inline-block bg-teal-50 border border-teal-200" />{" "}
              Đã nhập
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-auto plan-calendar-container">
          <Calendar
            value={selectedDate}
            mode="month"
            headerRender={() => <></>}
            cellRender={dateCellRender}
            onSelect={handleDateSelect}
            disabledDate={(d) =>
              d.month() !== selectedPeriod.month() ||
              d.year() !== selectedPeriod.year()
            }
          />
        </div>
      </div>

      {/* Day Editor */}
      {isEditingDay && (
        <div className="w-full lg:w-[480px] bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 bg-[#1a8649]/5 shrink-0">
            <h5 className="font-bold text-slate-800 uppercase">
              NHẬP DỮ LIỆU: NGÀY {selectedDate.format("DD/MM/YYYY")}
            </h5>
            <h6 className="text-slate-500 font-semibold mt-0.5 block">
              {selectedPeriod.format("[Tháng] MM/YYYY")}
            </h6>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {loading ? (
              <div className="text-center py-8">
                <Spin size="small" />
              </div>
            ) : targets.length === 0 ? (
              <div className="text-center text-slate-400 text-xs pt-8">
                Chưa có chỉ tiêu cho phòng ban này.
              </div>
            ) : (
              targets.map((target) => {
                const isParent = targets.some((t) => t.parentId === target.id);
                const dayValues = dailyData[target.id] || {
                  id: null,
                  productionOrderId: null,
                  productionDate: dateStr,
                  shiftDone: 0,
                  performDone: null,
                };
                const existing = existingReports.find(
                  (r) => r.targetId === target.id,
                );
                return (
                  <IndicatorCard
                    key={target.id}
                    target={target}
                    targets={targets}
                    isParent={isParent}
                    dayValues={dayValues}
                    existing={existing}
                    onChangeField={(field, val) =>
                      handleChange(target.id, field, val)
                    }
                  />
                );
              })
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="bg-white text-slate-700 border border-slate-300 rounded-lg py-2 px-5 font-semibold text-xs cursor-pointer hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmSave}
              disabled={saving || !isValid}
              className="bg-[#1a8649] text-white border-0 rounded-lg py-2 px-5 font-semibold text-xs cursor-pointer hover:bg-[#15703d] transition-all shadow-md shadow-[#1a8649]/15 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              {saving ? "Đang lưu..." : "Xác nhận"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
