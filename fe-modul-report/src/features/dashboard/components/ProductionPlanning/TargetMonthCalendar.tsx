import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar, InputNumber, Tag, Spin, message, DatePicker, Select, Tooltip } from "antd";
import { CalendarDays, CheckCircle2, Circle } from "lucide-react";
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

const toEntry = (r: TargetReportResponse, defaultDateStr?: string): DayEntry => ({
  id: r.id ?? null,
  productionOrderId: r.productionOrderId ?? null,
  productionDate: r.productionDate || defaultDateStr || "",
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
  defaultDateStr?: string;
  onChangeField: (field: keyof DayEntry, val: any) => void;
}
function IndicatorCard({
  target,
  targets,
  isParent,
  dayValues,
  existing,
  defaultDateStr,
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

  const effectiveDateStr = dayValues.productionDate || defaultDateStr;
  const isFilled =
    (dayValues.performDone != null && Number(dayValues.performDone) > 0) ||
    (dayValues.productionOrderId != null && Number(dayValues.productionOrderId) > 0);

  return (
    <div
      className={`rounded-lg p-3.5 flex flex-col gap-3.5 transition-all ${
        isFilled
          ? "bg-emerald-50/40 border-2 border-emerald-400/80 shadow-sm"
          : "bg-white border border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span
            className={`font-bold ${
              isFilled ? "text-emerald-950" : "text-slate-800"
            }`}
          >
            {target.name}
          </span>
          {target.code && (
            <span className="text-[10px] text-slate-400 font-mono">
              ({target.code})
            </span>
          )}
        </div>
        {isFilled ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
            <CheckCircle2 size={12} className="text-emerald-600" /> Đã điền
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            Chưa điền
          </span>
        )}
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
              placeholder={defaultDateStr ? dayjs(defaultDateStr).format("DD/MM/YYYY") : "Chọn ngày"}
              disabledDate={(d) => d.isAfter(dayjs(), "day")}
              value={
                effectiveDateStr
                  ? dayjs(effectiveDateStr)
                  : null
              }
              onChange={(d) =>
                onChangeField("productionDate", d ? d.format("YYYY-MM-DD") : defaultDateStr || "")
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
  onWorkshopChange?: (val: string) => void;
  onPeriodChange?: (val: Dayjs) => void;
  workshopOptions?: { value: string; label: string }[];
}

export function TargetMonthCalendar({
  selectedWorkshop,
  selectedPeriod,
  onWorkshopChange,
  onPeriodChange,
  workshopOptions,
}: Props) {
  const [targets, setTargets] = useState<TargetResponse[]>([]);
  const [existingReports, setExistingReports] = useState<
    TargetReportResponse[]
  >([]);
  const [dailyData, setDailyData] = useState<Record<string, DayEntry>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditingDay, setIsEditingDay] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => {
    const today = dayjs();
    if (today.month() === selectedPeriod.month() && today.year() === selectedPeriod.year()) {
      return today;
    }
    return selectedPeriod.startOf("month");
  });
  const [monthReportsMap, setMonthReportsMap] = useState<
    Record<string, TargetReportResponse[]>
  >({});

  useEffect(() => {
    const startOfMonth = selectedPeriod.startOf("month");
    const today = dayjs();
    if (today.month() === selectedPeriod.month() && today.year() === selectedPeriod.year()) {
      setSelectedDate(today);
    } else {
      setSelectedDate(startOfMonth);
    }
    setIsEditingDay(false);
    setDailyData({});
  }, [selectedPeriod.format("YYYY-MM")]);

  // ── Init savedDates & monthReportsMap cho cả tháng ───────────
  useEffect(() => {
    if (!selectedWorkshop) return;
    let cancelled = false;
    const monthStr = selectedPeriod.startOf("month").format("YYYY-MM-DD");

    targetReportApi
      .getDatesInMonth(selectedWorkshop, monthStr)
      .then(async (dates) => {
        if (dates && dates.length > 0) {
          const results = await Promise.all(
            dates.map((d) =>
              targetReportApi
                .getTargetReportByDepartmentAndMonth(selectedWorkshop, d)
                .then((reports) => ({ date: d, reports }))
                .catch(() => ({ date: d, reports: [] })),
            ),
          );
          if (cancelled) return;
          const map: Record<string, TargetReportResponse[]> = {};
          results.forEach((r) => {
            map[r.date] = r.reports;
          });
          setMonthReportsMap(map);
        } else {
          setMonthReportsMap({});
        }
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [selectedWorkshop, selectedPeriod.format("YYYY-MM")]);

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
            initialDailyData[node.targetId] = toEntry(node, dateStr);
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
        setMonthReportsMap((prev) => ({
          ...prev,
          [dateStr]: reports,
        }));
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

      targetReportApi
        .getTargetReportByDepartmentAndMonth(selectedWorkshop, dateStr)
        .then((updatedReports) => {
          setMonthReportsMap((prev) => ({
            ...prev,
            [dateStr]: updatedReports ?? [],
          }));
        })
        .catch(console.error);

      setIsEditingDay(false);
      message.success("Lưu dữ liệu ngày thành công!");
    } catch (err) {
      console.error(err);
      message.error("Lưu thất bại!");
    } finally {
      setSaving(false);
    }
  }, [dailyData, selectedDate, selectedWorkshop]);

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
        date.year() === selectedPeriod.year() &&
        !date.isAfter(dayjs(), "day")
      ) {
        setSelectedDate(date);
        setIsEditingDay(true);
      }
    },
    [selectedPeriod],
  );

  // ── Calculate Day Progress & Target Status ────────────────────
  const getDayProgress = useCallback(
    (dateKey: string) => {
      const reports = monthReportsMap[dateKey];

      if (reports && reports.length > 0) {
        const statusList: {
          targetId: string;
          name: string;
          code?: string;
          unit?: string;
          isParent: boolean;
          isFilled: boolean;
          performDone?: number | null;
        }[] = [];

        const walkNodes = (nodes: TargetReportResponse[]) => {
          nodes.forEach((node) => {
            const isParent = Boolean(node.children && node.children.length > 0);

            const performVal = node.performDone;
            const prodOrderId = node.productionOrderId;

            const isFilled =
              (performVal != null && Number(performVal) > 0) ||
              (prodOrderId != null && Number(prodOrderId) > 0);

            statusList.push({
              targetId: node.targetId,
              name: node.targetName ?? "",
              code: node.code ?? "",
              unit: node.unit ?? "",
              isParent,
              isFilled,
              performDone: performVal,
            });

            if (node.children?.length) {
              walkNodes(node.children);
            }
          });
        };

        walkNodes(reports);

        const leafList = statusList.filter((t) => !t.isParent);
        const totalCount = leafList.length;
        const filledCount = leafList.filter((t) => t.isFilled).length;
        const percent =
          totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

        return { filledCount, totalCount, percent, statusList };
      }

      if (targets.length > 0) {
        const leafTargets = targets.filter(
          (t) => !targets.some((other) => other.parentId === t.id),
        );
        const statusList = targets.map((t) => {
          const isParent = targets.some((other) => other.parentId === t.id);

          return {
            targetId: t.id,
            name: t.name,
            code: t.code,
            unit: t.unit,
            isParent,
            isFilled: false,
            performDone: null,
          };
        });

        return {
          filledCount: 0,
          totalCount: leafTargets.length,
          percent: 0,
          statusList,
        };
      }

      return { filledCount: 0, totalCount: 0, percent: 0, statusList: [] };
    },
    [monthReportsMap, targets],
  );

  const dateCellRender = useCallback(
    (current: Dayjs) => {
      const isCurrentMonth =
        current.month() === selectedPeriod.month() &&
        current.year() === selectedPeriod.year();
      if (!isCurrentMonth) return null;

      const isFuture = current.isAfter(dayjs(), "day");
      const dateKey = current.format("YYYY-MM-DD");
      const isSelected = current.isSame(selectedDate, "day") && isEditingDay;

      if (isFuture) {
        return (
          <div className="h-full w-full p-1.5 flex items-start border rounded-lg bg-slate-100/50 border-slate-200/50 opacity-30 cursor-not-allowed min-h-[40px] lg:min-h-[55px]" />
        );
      }

      const { filledCount, totalCount, percent, statusList } =
        getDayProgress(dateKey);
      const isFullyDone = totalCount > 0 && filledCount === totalCount;
      const isPartiallyDone = filledCount > 0 && !isFullyDone;

      const dateFormatted = current.format("DD/MM/YYYY");

      const tooltipContent = (
        <div className="p-1 min-w-[220px] max-w-[280px] text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
            <span className="font-bold text-slate-800 uppercase text-[11px]">
              Ngày {dateFormatted}
            </span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                isFullyDone
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : isPartiallyDone
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              {filledCount}/{totalCount} ({percent}%)
            </span>
          </div>

          {statusList.length === 0 ? (
            <div className="text-slate-400 py-1 text-[11px] italic">
              Chưa có thông tin chỉ tiêu.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
              {statusList.map((t) => {
                if (t.isParent) {
                  return (
                    <div
                      key={t.targetId}
                      className="font-bold text-slate-500 text-[10px] pt-1 mt-0.5 border-t border-slate-100 uppercase tracking-wide"
                    >
                      {t.name}
                    </div>
                  );
                }
                return (
                  <div
                    key={t.targetId}
                    className="flex items-center justify-between gap-2 pl-1.5"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      {t.isFilled ? (
                        <CheckCircle2
                          size={14}
                          className="text-emerald-600 shrink-0"
                        />
                      ) : (
                        <Circle
                          size={14}
                          className="text-slate-300 shrink-0"
                        />
                      )}
                      <span
                        className={`truncate text-[11px] ${
                          t.isFilled
                            ? "font-semibold text-slate-800"
                            : "text-slate-400"
                        }`}
                      >
                        {t.name}
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      {t.isFilled ? (
                        <span className="font-bold text-emerald-600 text-[11px]">
                          {t.performDone ?? 0} {t.unit}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          Chưa nhập
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );

      const cellMarkup = (
        <div
          className={`h-full w-full p-1.5 flex flex-col justify-between border rounded-lg transition-all min-h-[40px] lg:min-h-[55px] cursor-pointer ${
            isFullyDone
              ? "bg-teal-50/80 border-teal-300"
              : isPartiallyDone
              ? "bg-amber-50/70 border-amber-200"
              : "bg-white border-slate-100 hover:border-slate-300"
          } ${
            isSelected
              ? "ring-2 ring-[#1a8649] ring-offset-1 border-transparent shadow-sm"
              : ""
          }`}
        >
          {totalCount > 0 ? (
            <>
              <div className="flex justify-end items-center">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                    isFullyDone
                      ? "bg-teal-100 text-teal-800"
                      : isPartiallyDone
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {filledCount}/{totalCount}
                </span>
              </div>
              <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isFullyDone
                      ? "bg-teal-600"
                      : isPartiallyDone
                      ? "bg-amber-500"
                      : "bg-transparent"
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </>
          ) : (
            <div />
          )}
        </div>
      );

      return (
        <Tooltip
          title={tooltipContent}
          overlayInnerStyle={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            padding: "10px 12px",
            boxShadow:
              "0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)",
            border: "1px solid #e2e8f0",
          }}
          placement="top"
        >
          {cellMarkup}
        </Tooltip>
      );
    },
    [selectedPeriod, selectedDate, isEditingDay, getDayProgress],
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
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 shrink-0 flex-wrap gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-[#1a8649]" />
              <h2 className="text-xs font-bold text-slate-700 uppercase">
                Lịch sản xuất
              </h2>
            </div>

            {/* Antd Month Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Chọn Tháng:</span>
              <DatePicker
                picker="month"
                size="small"
                className="w-36"
                value={selectedPeriod}
                onChange={(date) => {
                  if (date && onPeriodChange) {
                    onPeriodChange(date);
                  }
                }}
                format="[Tháng] MM/YYYY"
                allowClear={false}
              />
            </div>

            {/* Antd Workshop Selector */}
            {workshopOptions && workshopOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Phân xưởng:</span>
                <Select
                  size="small"
                  className="w-52"
                  value={selectedWorkshop || undefined}
                  onChange={(val) => {
                    if (onWorkshopChange) onWorkshopChange(val);
                  }}
                  options={workshopOptions}
                  placeholder="Chọn phân xưởng"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3.5 text-[10px] font-semibold flex-wrap">
            {loading && <Spin size="small" />}
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="w-2.5 h-2.5 rounded inline-block bg-slate-100 border border-slate-200" />{" "}
              Chưa nhập
            </span>
            <span className="flex items-center gap-1.5 text-amber-800">
              <span className="w-2.5 h-2.5 rounded inline-block bg-amber-100 border border-amber-300" />{" "}
              Nhập một phần
            </span>
            <span className="flex items-center gap-1.5 text-teal-800">
              <span className="w-2.5 h-2.5 rounded inline-block bg-teal-100 border border-teal-300" />{" "}
              Đã nhập đủ
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
              d.year() !== selectedPeriod.year() ||
              d.isAfter(dayjs(), "day")
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
                    defaultDateStr={dateStr}
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
