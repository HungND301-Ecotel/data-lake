import { useEffect, useMemo, useState } from "react";
import { TrendingUp, Activity, X } from "lucide-react";
import dayjs, { Dayjs } from "dayjs";
import { Tabs } from "antd";
import { InitPlan } from "./InitPlan";
import { TargetMonthCalendar } from "./TargetMonthCalendar";
import { TargetSummary } from "./TargetSummary";
import { departmentApi } from "../../../department/api/departmentApi";
import type { DepartmentResponse } from "../../../department/types/department";

interface PlanModalProps {
  onClose: () => void;
  mode?: "plan" | "operation";
  onAddBatch?: (newBatch: any) => void;
}

export function PlanModal({ onClose, mode = "plan" }: PlanModalProps) {
  const [selectedWorkshop, setSelectedWorkshop] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<Dayjs>(dayjs());
  const [depts, setDepts] = useState<DepartmentResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    departmentApi
      .searchDepartment("", 0, 1000)
      .then((res) => {
        if (cancelled) return;
        if (res?.content) {
          setDepts(res.content);
          if (!selectedWorkshop && res.content.length > 0) {
            const first = res.content.find((d) => d.id);
            if (first?.id) setSelectedWorkshop(first.id);
          }
        }
      })
      .catch((err) => console.error("Failed to load departments in PlanModal:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  const workshopOptions = useMemo(
    () =>
      depts
        .filter((d) => d.id)
        .map((d) => ({
          value: d.id as string,
          label: d.name?.trim() || d.code?.trim() || "Phòng ban",
        })),
    [depts],
  );

  const isOperation = mode === "operation";

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6">
      <div className="bg-[#f7f9fb] w-[96vw] h-[96vh] max-w-[1720px] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0 relative">
          <div className="flex items-center gap-3 z-10">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isOperation
                  ? "bg-blue-50 text-blue-600"
                  : "bg-[#1a8649]/10 text-[#1a8649]"
              }`}
            >
              {isOperation ? <Activity size={22} /> : <TrendingUp size={22} />}
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 tracking-tight leading-none uppercase">
                {isOperation ? "ĐIỀU HÀNH SẢN XUẤT" : "LẬP KẾ HOẠCH SẢN XUẤT"}
              </h1>
              <span className="text-xs text-slate-500 font-medium mt-1 inline-block">
                {isOperation
                  ? "Nhật trình dữ liệu sản xuất ngày & Báo cáo tổng quan"
                  : "Tạo chỉ tiêu và lập kế hoạch sản xuất các phân xưởng"}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 border-0 bg-transparent flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all cursor-pointer z-10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden p-6 flex flex-col">
          <style>{`
            .custom-planning-tabs {
              height: 100%;
              display: flex;
              flex-direction: column;
            }
            .custom-planning-tabs > .ant-tabs-nav {
              margin-bottom: 16px !important;
            }
            .custom-planning-tabs > .ant-tabs-content-holder {
              flex: 1;
              display: flex;
              flex-direction: column;
              overflow: hidden;
            }
            .custom-planning-tabs .ant-tabs-content {
              height: 100%;
              display: flex;
              flex-direction: column;
            }
            .custom-planning-tabs .ant-tabs-tabpane:not(.ant-tabs-tabpane-hidden) {
              height: 100%;
              display: flex;
              flex-direction: column;
              overflow: hidden;
            }
            /* Custom active color */
            .custom-planning-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
              color: ${isOperation ? "#0284c7" : "#1a8649"} !important;
              font-weight: 700;
            }
            .custom-planning-tabs .ant-tabs-tab:hover {
              color: ${isOperation ? "#0369a1" : "#15703d"} !important;
            }
            .custom-planning-tabs .ant-tabs-ink-bar {
              background: ${isOperation ? "#0284c7" : "#1a8649"} !important;
              height: 3px !important;
            }
          `}</style>
          {isOperation ? (
            <Tabs
              defaultActiveKey="1"
              className="custom-planning-tabs"
              items={[
                {
                  key: "1",
                  label: (
                    <span className="text-xs font-semibold px-2">
                      Điền dữ liệu theo ngày
                    </span>
                  ),
                  children: (
                    <TargetMonthCalendar
                      selectedWorkshop={selectedWorkshop}
                      selectedPeriod={selectedPeriod}
                      onWorkshopChange={setSelectedWorkshop}
                      onPeriodChange={setSelectedPeriod}
                      workshopOptions={workshopOptions}
                    />
                  ),
                },
                {
                  key: "2",
                  label: (
                    <span className="text-xs font-semibold px-2">Tổng quan</span>
                  ),
                  children: (
                    <TargetSummary
                      selectedPeriod={selectedPeriod}
                      onPeriodChange={setSelectedPeriod}
                    />
                  ),
                },
              ]}
            />
          ) : (
            <InitPlan
              selectedWorkshop={selectedWorkshop}
              selectedPeriod={selectedPeriod}
              onWorkshopChange={setSelectedWorkshop}
              onPeriodChange={setSelectedPeriod}
              workshopOptionsProp={workshopOptions}
            />
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="bg-white text-slate-700 border border-slate-300 rounded-lg py-2 px-6 font-semibold text-xs cursor-pointer hover:bg-slate-50 transition-all shadow-sm"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
