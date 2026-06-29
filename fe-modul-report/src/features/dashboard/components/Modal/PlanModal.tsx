import {
  Upload,
  TrendingUp,
  Layers,
  Users,
  Database,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";

const PLAN_TYPE_MAP: Record<string, string> = {
  "ke-hoach-san-xuat": "Kế hoạch sản xuất",
  "ke-hoach-nhan-su": "Kế hoạch nhân sự",
  "ke-hoach-vat-tu": "Kế hoạch vật tư",
  "ke-hoach-tai-chinh": "Kế hoạch tài chính",
};

const REPORT_TARGET_MAP: Record<string, string> = {
  both: "Nội bộ + TKV",
  noidung: "Chỉ báo cáo nội bộ",
  tkv: "Chỉ báo cáo TKV",
};

interface PlanModalProps {
  onClose: () => void;
  departments: string[];
  onAddBatch: (batch: any) => void;
}

export function PlanModal({
  onClose,
  departments,
  onAddBatch,
}: PlanModalProps) {
  const [step, setStep] = useState(1);
  const [dept, setDept] = useState("");
  const [planType, setPlanType] = useState("");
  const [period, setPeriod] = useState("Tháng 4/2026");
  const [target, setTarget] = useState("both");
  const [inputMode, setInputMode] = useState("upload");
  const [uploadedFile, setUploadedFile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const planCards = [
    {
      type: "ke-hoach-san-xuat",
      icon: <TrendingUp size={20} />,
      label: "Kế hoạch sản xuất",
      sub: "Than, mét lò, CBSX...",
    },
    {
      type: "ke-hoach-nhan-su",
      icon: <Users size={20} />,
      label: "Kế hoạch nhân sự",
      sub: "Lao động, ca làm việc...",
    },
    {
      type: "ke-hoach-vat-tu",
      icon: <Layers size={20} />,
      label: "Kế hoạch vật tư",
      sub: "Nhập - xuất - tồn kho...",
    },
    {
      type: "ke-hoach-tai-chinh",
      icon: <Database size={20} />,
      label: "Kế hoạch tài chính",
      sub: "Chi phí, doanh thu...",
    },
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!dept) {
        alert("Vui lòng chọn phòng ban");
        return;
      }
      if (!planType) {
        alert("Vui lòng chọn loại kế hoạch");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      onAddBatch({
        id: Date.now(),
        name: `Lập kế hoạch: ${PLAN_TYPE_MAP[planType] || "Mới"}`,
        creator: "Nguyễn Văn A",
        year: 2026,
        month: period.includes("Tháng") ? period.replace("Tháng ", "") : period,
        day:
          new Date().getDate().toString().padStart(2, "0") +
          "/" +
          (new Date().getMonth() + 1).toString().padStart(2, "0"),
        status: "Chưa đồng bộ",
        file: uploadedFile || "nhap_tay.xlsx",
      });
    }, 1800);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 w-full max-w-[640px] animate-slideUp">
        {/* Header */}
        <div className="p-5 px-7 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex flex-col">
            <div className="font-semibold text-sm text-slate-900">
              Lập kế hoạch mới
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Gắn tự động vào các luồng báo cáo nội bộ & TKV
            </div>
          </div>
          <button
            className="bg-transparent border-0 text-slate-400 text-lg cursor-pointer transition-all hover:text-slate-950"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Wizard Steps */}
        <div className="flex bg-slate-50 border-b border-slate-100">
          {["1. Loại & Phòng ban", "2. Nhập dữ liệu", "3. Xác nhận & Gửi"].map(
            (label, idx) => {
              const s = idx + 1;
              return (
                <div
                  key={s}
                  className={`flex-1 text-center py-3.5 px-2 text-xs font-semibold transition-all ${
                    step === s
                      ? "bg-white text-teal-700 shadow-[inset_0_-3px_0_0_#10b981]"
                      : step > s
                        ? "text-teal-700 bg-emerald-50"
                        : "text-slate-400"
                  }`}
                >
                  {label}
                </div>
              );
            },
          )}
        </div>

        {/* Body */}
        <div className="p-7 overflow-y-auto">
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5 mb-1">
                <label className="text-xs font-semibold text-slate-500">
                  Chọn phòng ban phụ trách *
                </label>
                <select
                  className="border border-slate-100 rounded-lg p-2.5 px-3.5 text-xs text-slate-950 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {departments.slice(1).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500">
                  Loại kế hoạch *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {planCards.map((pc) => (
                    <div
                      key={pc.type}
                      onClick={() => setPlanType(pc.type)}
                      className="rounded-xl p-3.5 flex items-center gap-3 cursor-pointer transition-all border"
                      style={{
                        borderColor:
                          planType === pc.type ? "#0f766e" : "#f1f5f9",
                        backgroundColor:
                          planType === pc.type ? "#f0fdf4" : "#ffffff",
                        borderWidth: planType === pc.type ? "2px" : "1px",
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor:
                            planType === pc.type ? "#ffffff" : "#f8fafc",
                          color: planType === pc.type ? "#0f766e" : "#334155",
                        }}
                      >
                        {pc.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-slate-900">
                          {pc.label}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {pc.sub}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Kỳ kế hoạch
                  </label>
                  <select
                    className="border border-slate-100 rounded-lg p-2.5 px-3.5 text-xs text-slate-950 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  >
                    <option>Tháng 4/2026</option>
                    <option>Tháng 5/2026</option>
                    <option>Quý II/2026</option>
                    <option>Năm 2026</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500">
                    Luồng liên kết
                  </label>
                  <select
                    className="border border-slate-100 rounded-lg p-2.5 px-3.5 text-xs text-slate-950 outline-none transition-all focus:border-teal-700 focus:ring-4 focus:ring-teal-700/10"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  >
                    <option value="both">Nội bộ + TKV</option>
                    <option value="noidung">Chỉ báo cáo nội bộ</option>
                    <option value="tkv">Chỉ báo cáo TKV</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="flex gap-3">
                {(["upload", "form"] as const).map((mode) => (
                  <button
                    key={mode}
                    className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center font-semibold text-xs border transition-all ${
                      inputMode === mode
                        ? "bg-teal-700 text-white border-teal-700 shadow-md"
                        : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"
                    }`}
                    onClick={() => setInputMode(mode)}
                  >
                    {mode === "upload"
                      ? "📂 Tải lên Excel"
                      : "✏️ Nhập tay thủ công"}
                  </button>
                ))}
              </div>

              {inputMode === "upload" && (
                <div className="flex flex-col gap-4">
                  <div
                    onClick={() =>
                      setUploadedFile(
                        `KH_${(PLAN_TYPE_MAP[planType] || "").replace(/\s/g, "_")}_${period.replace(/\//g, "_")}.xlsx`,
                      )
                    }
                    className="border-2 border-dashed border-emerald-200 rounded-xl p-9 text-center bg-emerald-50/50 cursor-pointer transition-all hover:bg-emerald-50"
                  >
                    <Upload size={32} className="text-teal-700 mx-auto mb-3" />
                    <div className="text-xs font-semibold text-teal-800">
                      Kéo thả hoặc bấm để tải lên file Excel
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      Hỗ trợ các định dạng .xlsx, .xls (tối đa 10MB)
                    </div>
                    {uploadedFile && (
                      <div className="inline-flex items-center text-[10px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 mt-3">
                        ✓ Đã chọn: {uploadedFile}
                      </div>
                    )}
                  </div>
                  <div className="p-3 px-4 bg-slate-50 rounded-lg text-[11px] text-slate-500 flex justify-between items-center">
                    <span>Cần file mẫu để nhập liệu?</span>
                    <span
                      className="underline cursor-pointer text-teal-700 font-semibold"
                      onClick={() => alert("Đang tải mẫu...")}
                    >
                      Tải mẫu {PLAN_TYPE_MAP[planType] || "kế hoạch"}.xlsx
                    </span>
                  </div>
                </div>
              )}

              {inputMode === "form" && (
                <div className="flex flex-col gap-3">
                  <div className="text-xs font-semibold text-slate-500">
                    Nhập các chỉ tiêu kế hoạch chi tiết:
                  </div>
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        {[
                          "Chỉ tiêu sản xuất",
                          "ĐVT",
                          "Kế hoạch tháng",
                          "Kế hoạch năm",
                        ].map((h) => (
                          <th
                            key={h}
                            className="py-2.5 text-[10px] font-bold uppercase text-slate-400"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "Than nguyên khai",
                        "Mét lò đào mới",
                        "XDCB",
                        "CBSX",
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="py-2 text-xs font-semibold text-slate-900">
                            {row}
                          </td>
                          <td className="py-2 text-xs text-center text-slate-500">
                            {i === 0 ? "Tấn" : "m"}
                          </td>
                          <td className="py-2">
                            <input
                              className="border border-slate-200 rounded-lg p-1.5 px-3 text-xs w-[120px]"
                              placeholder="0"
                            />
                          </td>
                          <td className="py-2">
                            <input
                              className="border border-slate-200 rounded-lg p-1.5 px-3 text-xs w-[120px]"
                              placeholder="0"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              {!submitted && !submitting && (
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-5">
                  <div className="text-xs font-bold text-teal-800 mb-3">
                    Xác nhận thông tin kế hoạch
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {[
                      ["Phòng ban phụ trách:", dept],
                      ["Loại kế hoạch:", PLAN_TYPE_MAP[planType] || ""],
                      ["Kỳ kế hoạch:", period],
                      ["Gắn liên kết:", REPORT_TARGET_MAP[target]],
                      [
                        "Nguồn dữ liệu:",
                        inputMode === "upload"
                          ? uploadedFile || "File chưa chọn"
                          : "Nhập dữ liệu trực tiếp trên form",
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex justify-between text-xs border-b border-emerald-100/30 pb-1.5"
                      >
                        <span className="text-slate-500">{label}</span>
                        <span className="font-semibold text-slate-900">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {submitting && (
                <div className="bg-slate-50 rounded-xl p-8 text-center flex flex-col items-center gap-3">
                  <RefreshCw size={28} className="text-teal-700 animate-spin" />
                  <div className="text-xs font-semibold text-slate-800">
                    Đang tạo kế hoạch sản xuất...
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Hệ thống đang lưu trữ và kết xuất liên kết báo cáo.
                  </div>
                </div>
              )}
              {submitted && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center flex flex-col items-center gap-3">
                  <CheckCircle2 size={40} className="text-emerald-500" />
                  <div className="text-sm font-bold text-teal-900">
                    Đã khởi tạo kế hoạch thành công!
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    <b>{PLAN_TYPE_MAP[planType]}</b> — {dept} — {period}
                  </div>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 mt-1">
                    Đã liên kết luồng: {REPORT_TARGET_MAP[target]}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 px-7 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          {step > 1 && !submitted && (
            <button
              className="bg-white text-slate-700 border border-slate-200 rounded-lg py-2 px-4 font-medium text-xs cursor-pointer flex items-center gap-2 transition-all hover:bg-slate-50"
              onClick={() => setStep((s) => s - 1)}
            >
              ← Quay lại
            </button>
          )}
          {step < 3 && (
            <button
              className="bg-teal-700 text-white border-0 rounded-lg py-2 px-4 font-semibold text-xs cursor-pointer flex items-center gap-2 transition-all hover:bg-teal-800 shadow-md shadow-teal-900/15"
              onClick={handleNext}
            >
              Tiếp theo →
            </button>
          )}
          {step === 3 && !submitted && !submitting && (
            <button
              className="bg-emerald-600 text-white border-0 rounded-lg py-2 px-4 font-semibold text-xs cursor-pointer flex items-center gap-2 transition-all hover:bg-emerald-700 shadow-md shadow-emerald-900/15"
              onClick={handleSubmit}
            >
              Hoàn tất & Khởi tạo
            </button>
          )}
          {submitted && (
            <button
              className="bg-teal-700 text-white border-0 rounded-lg py-2 px-4 font-semibold text-xs cursor-pointer flex items-center gap-2 transition-all hover:bg-teal-800"
              onClick={onClose}
            >
              Đóng cửa sổ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

