import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import dayjs from "dayjs";
import { whBatchApi } from "../../api/whBatchApi";
import type { WhBatchDashboardResponse } from "../../types/whBatch";
import type { DepartmentResponse } from "../../../department/types/department";

interface InternalReportsSectionProps {
  selectedDate: string;
  realDepts: DepartmentResponse[];
  onPreview: (code: string, readOnly: boolean) => void;
  onTrinhDuyet: (code: string) => void;
}

export function InternalReportsSection({
  selectedDate,
  realDepts,
  onPreview,
  onTrinhDuyet,
}: InternalReportsSectionProps) {
  const [internalDeptId, setInternalDeptId] = useState<string>("all");
  const [internalReports, setInternalReports] = useState<WhBatchDashboardResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const dayStr = dayjs(selectedDate).format("DD/MM/YYYY");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const parsedDate = dayjs(selectedDate);

    whBatchApi
      .getDashboard({
        departmentId: internalDeptId === "all" ? undefined : internalDeptId,
        reportType: "Noi_Bo",
        reportYear: parsedDate.year(),
        reportMonth: parsedDate.month() + 1,
        reportDay: parsedDate.date(),
      })
      .then((res) => {
        if (!cancelled) {
          setInternalReports(res);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load internal reports:", err);
          setInternalReports([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [internalDeptId, selectedDate]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] overflow-hidden flex flex-col">
      <div className="p-4 px-5 flex justify-between items-center bg-slate-50/50 border-b border-slate-100">
        <span className="font-bold text-sm tracking-wide text-slate-900 uppercase">
          A. BÁO CÁO NỘI BỘ — TỪ CÁC PHÒNG BAN
        </span>
      </div>
      <div className="p-6 flex flex-col gap-5">
        {/* Selector */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 w-24">
            Phòng ban:
          </label>
          <select
            className="border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none cursor-pointer flex-1 transition-all hover:border-slate-300 focus:border-[#1a8649] focus:bg-white"
            value={internalDeptId}
            onChange={(e) => setInternalDeptId(e.target.value)}
          >
            <option value="all">Tất cả phòng ban</option>
            {realDepts.map((dept) => (
              <option key={dept.id} value={String(dept.id)}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cards List */}
        <div className="flex flex-col gap-4 max-h-[550px] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-xs">
              <RefreshCw className="animate-spin mr-2" size={16} />
              Đang tải danh sách báo cáo nội bộ...
            </div>
          ) : internalReports.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              Không có báo cáo nội bộ nào cho ngày {dayStr}
            </div>
          ) : (
            internalReports.map((report) => {
              let statusBg = "bg-amber-50 text-amber-700 border-amber-100";
              let statusText = "Chờ duyệt";
              if (report.wareBatchStatus === "SUCCESS") {
                statusBg = "bg-emerald-50 text-emerald-700 border-emerald-100";
                statusText = "Thành công";
              } else if (report.wareBatchStatus === "FAILURE") {
                statusBg = "bg-rose-50 text-rose-700 border-rose-100";
                statusText = "Lỗi đồng bộ";
              }

              const formattedTime = dayjs(report.updatedAt).format(
                "HH:mm - DD/MM/YYYY",
              );

              return (
                <div
                  key={report.id}
                  className="bg-white rounded-xl border border-slate-100 shadow-[0_2px_8px_rgba(15,23,42,0.02)] hover:shadow-md transition-all duration-300 p-5 flex flex-col gap-4 group"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex flex-col gap-1 flex-1">
                      <span className="text-[10px] font-bold text-slate-400 font-mono tracking-wider uppercase">
                        {report.code} | {report.tableCode}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#1a8649] transition-colors leading-snug">
                        {report.name}
                      </h4>
                      {report.description && (
                        <p className="text-xs text-slate-400 italic mt-0.5 px-2 py-1">
                          {report.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${statusBg}`}
                    >
                      {statusText}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-col gap-2.5 bg-slate-50/50 rounded-xl p-3 border border-slate-100/50">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Loại báo cáo:</span>
                      <span className="font-semibold text-slate-800">
                        {report.reportName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Người cập nhật:</span>
                      <span className="font-medium text-slate-700">
                        {report.employeeName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Thời gian cập nhật:</span>
                      <span className="text-slate-700">{formattedTime}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => onPreview(report.code, true)}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs py-2 px-2 rounded-lg border border-slate-200 cursor-pointer transition-all active:scale-[0.98] text-center"
                    >
                      Xem
                    </button>
                    <button
                      onClick={() => onPreview(report.code, false)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs py-2 px-2 rounded-lg border border-blue-200 cursor-pointer transition-all active:scale-[0.98] text-center"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => onTrinhDuyet(report.code)}
                      className="flex-1 bg-[#1a8649] hover:bg-[#15703d] text-white font-semibold text-xs py-2 px-2 rounded-lg border-0 cursor-pointer transition-all active:scale-[0.98] text-center shadow-sm"
                    >
                      Trình duyệt
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
