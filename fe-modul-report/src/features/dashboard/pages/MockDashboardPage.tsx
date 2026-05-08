import { useState, useRef, useCallback } from "react";

interface PlanEntry {
  dept: string;
  type: string;
  period: string;
  target: string;
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const COMPANY_NAME = "CÔNG TY CỔ PHẦN THAN ĐÈO NAI CỌC SÁU - VINACOMIN";
const COMPANY_DEPT = "PHÒNG KẾ HOẠCH - VẬT TƯ";
const BIEU_MAU = "BIỂU MẪU SỐ 01/VT";

const DEPTS = [
  "Tất cả",
  "PX Than Nguyên Khai",
  "PX Than Sạch",
  "PX Cơ điện",
  "Phòng Kế hoạch - Vật tư",
  "Phòng Kế toán",
  "Phòng Nhân sự",
];

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

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const PRODUCTION_TABLE = [
  { chiTieu: "Than NK sản xuất", dvj: "Tấn", homNay: 6917, luyKe: 28981, kh: 30000 },
  { chiTieu: "Mét lò đào mới", dvj: "m", homNay: 3140, luyKe: 581.1, kh: 600 },
  { chiTieu: "XDCB", dvj: "m", homNay: 310, luyKe: 71.4, kh: 75 },
  { chiTieu: "CBSX", dvj: "m", homNay: 2520, luyKe: 452.9, kh: 470 },
  { chiTieu: "Mò xén", dvj: "m", homNay: 105, luyKe: 56.8, kh: 60 },
];

const WORKER_TABLE = [
  { nhanluc: "Phó QĐ trực ca", o: 1, f: 0, tt: "", tLo: 29, dien: 15, co: 7, bch: 3, tLoVang: 3, cdienVang: 0, hl: "amber" },
  { nhanluc: "Thợ lò", o: 32, f: 1, tt: "", tLo: 29, dien: "", co: "", bch: "", tLoVang: 3, cdienVang: "", hl: "blue" },
  { nhanluc: "Cơ điện", o: 15, f: "", tt: "", tLo: "", dien: 15, co: "", bch: "", tLoVang: "", cdienVang: 0, hl: "green" },
  { nhanluc: "BCH, Phục vụ", o: "", f: "F:1", tt: "", tLo: "", dien: "", co: 7, bch: "", tLoVang: "", cdienVang: "", hl: "" },
];

const WORKFORCE = {
  total: 1450,
  diLam: 29,
  diLamBreakdown: { thoLo: 29, dienCo: 15, bch: 7 },
  vang: 5,
  nghi: 1,
  nghiLuyKe: 16,
};

const MOCK_SYNC_LOG = [
  { ts: "05/04 08:30", noidung: "PX Than NK — Ngày 5", ok: true },
  { ts: "05/04 09:15", noidung: "PX Than Sạch — Ngày 5", ok: true },
  { ts: "04/04 08:20", noidung: "PX Than NK — Ngày 4", ok: true },
  { ts: "04/04 09:00", noidung: "PX Than Sạch — Ngày 4", ok: false },
];

const VATTU_GROUPS = [
  {
    code: "A", maChiTieu: "VL", tenNhom: "Vật liệu",
    items: [
      { stt: 1, ma: "5000000000001", ten: "Thuốc nổ và VLNCN", dauKy: 476838.21, nhapMua: 8418041.25, nhapKhac: 0, xuatSX: 8502048.73, xuatKhac: 0 },
      { stt: 2, ma: "5000000000002", ten: "Gỗ lò, gỗ các loại", dauKy: 478464.84, nhapMua: 3782310, nhapKhac: 155600, xuatSX: 3975936.79, xuatKhac: 375411.74 },
      { stt: 3, ma: "5000000000003", ten: "Thép lò, vì lò, phụ kiện", dauKy: 3151728.98, nhapMua: 25192141.75, nhapKhac: 4357294.73, xuatSX: 28103647.24, xuatKhac: 3666878.97 },
      { stt: 4, ma: "5000000000018", ten: "Phụ tùng SCTX", dauKy: 5480087.75, nhapMua: 17324953, nhapKhac: 194098.9, xuatSX: 8833380.38, xuatKhac: 1994979.35 },
      { stt: 5, ma: "5000000000022", ten: "Dầu mỡ phụ", dauKy: 1147737.65, nhapMua: 2749487.05, nhapKhac: 0, xuatSX: 2760818.28, xuatKhac: 45306.4 },
    ],
  },
  {
    code: "B", maChiTieu: "NL", tenNhom: "Nhiên liệu",
    items: [
      { stt: 1, ma: "5000000000025", ten: "Xăng, dầu", dauKy: 827758.85, nhapMua: 3688140.83, nhapKhac: 0, xuatSX: 4471806.13, xuatKhac: 44093.55 },
      { stt: 2, ma: "5000000000026", ten: "Than", dauKy: 0, nhapMua: 0, nhapKhac: 0, xuatSX: 0, xuatKhac: 0 },
    ],
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtNum = (n: any) =>
  n == null || n === "" ? "" : new Intl.NumberFormat("vi-VN").format(Math.round(n));

const sumField = (items: any[], field: string) =>
  items.reduce((s, it) => s + (it[field] ?? 0), 0);

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ data, color = "#1a56db" }: { data: number[]; color?: string }) {
  const w = 110, h = 36;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`)
    .join("L");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <path d={`M${pts}L${w},${h}L0,${h}Z`} fill={color + "22"} />
      <path d={`M${pts}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── VAT TU REPORT PAPER (Print-ready) ───────────────────────────────────────
function VatTuPaper({ printRef }: { printRef: React.RefObject<HTMLDivElement | null> }) {
  const allItems = VATTU_GROUPS.flatMap((g) => g.items);
  const grand = {
    dauKy: sumField(allItems, "dauKy"),
    nhapMua: sumField(allItems, "nhapMua"),
    nhapKhac: sumField(allItems, "nhapKhac"),
    xuatSX: sumField(allItems, "xuatSX"),
    xuatKhac: sumField(allItems, "xuatKhac"),
  };
  const grandTN = grand.nhapMua + grand.nhapKhac;
  const grandTX = grand.xuatSX + grand.xuatKhac;
  const grandTC = grand.dauKy + grandTN - grandTX;

  const S = {
    th: { border: "1px solid #000", padding: "3px 4px", fontSize: 8, fontWeight: 700, textAlign: "center" as const, verticalAlign: "middle" as const, background: "#e8edf7" },
    thDark: { border: "1px solid #000", padding: "3px 4px", fontSize: 8, fontWeight: 700, textAlign: "center" as const, verticalAlign: "middle" as const, background: "#c9d4e8" },
    td: { border: "1px solid #999", padding: "2px 4px", fontSize: 8, verticalAlign: "middle" as const },
    tdC: { border: "1px solid #999", padding: "2px 4px", fontSize: 8, verticalAlign: "middle" as const, textAlign: "center" as const },
    tdR: { border: "1px solid #999", padding: "2px 4px", fontSize: 8, verticalAlign: "middle" as const, textAlign: "right" as const },
    tdGroup: { border: "1px solid #888", padding: "3px 4px", fontSize: 8, fontWeight: 700, verticalAlign: "middle" as const, background: "#c9d4e8" },
    tdGroupR: { border: "1px solid #888", padding: "3px 4px", fontSize: 8, fontWeight: 700, verticalAlign: "middle" as const, background: "#c9d4e8", textAlign: "right" as const },
    tdTotal: { border: "1px solid #888", padding: "3px 4px", fontSize: 8, fontWeight: 700, verticalAlign: "middle" as const, background: "#e8edf7", textAlign: "right" as const },
  } satisfies Record<string, React.CSSProperties>;

  const today = new Date();

  return (
    <div ref={printRef} style={{ width: "100%", background: "#fff", padding: "24px 28px", fontFamily: '"Times New Roman", Times, serif', color: "#000", fontSize: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12 }}>{COMPANY_NAME}</div>
          <div style={{ fontWeight: 700, fontSize: 11 }}>{COMPANY_DEPT}</div>
          <div style={{ borderBottom: "2.5px solid #000", width: 380, marginTop: 4 }} />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700 }}>{BIEU_MAU}</div>
          <div>Năm: <b>2026</b> — Kỳ: <b>Quý I</b></div>
          <div style={{ fontStyle: "italic", fontSize: 9 }}>ĐVT: Nghìn đồng</div>
        </div>
      </div>

      <div style={{ textAlign: "center", margin: "10px 0 8px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, textTransform: "uppercase" }}>Báo Cáo Tổng Hợp Luân Chuyển Vật Tư</div>
        <div style={{ fontWeight: 700, fontSize: 11, marginTop: 2 }}>(NHẬP - XUẤT - TỒN) — Quý I Năm 2026</div>
      </div>

      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ ...S.thDark, width: 25 }}>STT</th>
            <th rowSpan={2} style={{ ...S.thDark, width: 60 }}>Mã CT</th>
            <th rowSpan={2} style={{ ...S.thDark, minWidth: 140 }}>Tên vật tư</th>
            <th rowSpan={2} style={{ ...S.thDark, width: 70 }}>Tồn đầu kỳ</th>
            <th colSpan={3} style={S.thDark}>Nhập trong kỳ</th>
            <th colSpan={3} style={S.thDark}>Xuất trong kỳ</th>
            <th rowSpan={2} style={{ ...S.thDark, width: 70 }}>Tồn cuối kỳ</th>
          </tr>
          <tr>
            {["Tổng nhập", "Từ mua", "Từ khác", "Tổng xuất", "Xuất SX", "Xuất khác"].map((h) => (
              <th key={h} style={{ ...S.th, width: 68 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Grand total row */}
          <tr>
            <td colSpan={3} style={{ ...S.tdTotal, textAlign: "left" }}>TỔNG CỘNG</td>
            <td style={S.tdTotal}>{fmtNum(grand.dauKy)}</td>
            <td style={S.tdTotal}>{fmtNum(grandTN)}</td>
            <td style={S.tdTotal}>{fmtNum(grand.nhapMua)}</td>
            <td style={S.tdTotal}>{fmtNum(grand.nhapKhac)}</td>
            <td style={S.tdTotal}>{fmtNum(grandTX)}</td>
            <td style={S.tdTotal}>{fmtNum(grand.xuatSX)}</td>
            <td style={S.tdTotal}>{fmtNum(grand.xuatKhac)}</td>
            <td style={S.tdTotal}>{fmtNum(grandTC)}</td>
          </tr>

          {VATTU_GROUPS.map((group) => {
            const gt = {
              dauKy: sumField(group.items, "dauKy"),
              nhapMua: sumField(group.items, "nhapMua"),
              nhapKhac: sumField(group.items, "nhapKhac"),
              xuatSX: sumField(group.items, "xuatSX"),
              xuatKhac: sumField(group.items, "xuatKhac"),
            };
            const gtTN = gt.nhapMua + gt.nhapKhac;
            const gtTX = gt.xuatSX + gt.xuatKhac;
            const gtTC = gt.dauKy + gtTN - gtTX;

            return [
              // Group header row
              <tr key={`g-${group.code}`}>
                <td style={{ ...S.tdGroup, textAlign: "center" }}>{group.code}</td>
                <td style={{ ...S.tdGroup, textAlign: "center" }}>{group.maChiTieu}</td>
                <td style={{ ...S.tdGroup, fontStyle: "italic" }}>{group.tenNhom}</td>
                <td style={S.tdGroupR}>{fmtNum(gt.dauKy)}</td>
                <td style={S.tdGroupR}>{fmtNum(gtTN)}</td>
                <td style={S.tdGroupR}>{fmtNum(gt.nhapMua)}</td>
                <td style={S.tdGroupR}>{fmtNum(gt.nhapKhac)}</td>
                <td style={S.tdGroupR}>{fmtNum(gtTX)}</td>
                <td style={S.tdGroupR}>{fmtNum(gt.xuatSX)}</td>
                <td style={S.tdGroupR}>{fmtNum(gt.xuatKhac)}</td>
                <td style={S.tdGroupR}>{fmtNum(gtTC)}</td>
              </tr>,

              // Item rows
              ...group.items.map((item, idx) => {
                const tn = (item.nhapMua ?? 0) + (item.nhapKhac ?? 0);
                const tx = (item.xuatSX ?? 0) + (item.xuatKhac ?? 0);
                const tc = (item.dauKy ?? 0) + tn - tx;
                const hasAny = item.dauKy || item.nhapMua || item.xuatSX;
                return (
                  <tr key={item.ma} style={{ background: idx % 2 === 0 ? "#fff" : "#f8f9fc" }}>
                    <td style={S.tdC}>{item.stt}</td>
                    <td style={{ ...S.tdC, fontSize: 7 }}>{item.ma}</td>
                    <td style={S.td}>{item.ten}</td>
                    <td style={S.tdR}>{fmtNum(item.dauKy) || ""}</td>
                    <td style={S.tdR}>{hasAny ? fmtNum(tn) : ""}</td>
                    <td style={{ ...S.tdR, color: "#14532d" }}>{fmtNum(item.nhapMua) || ""}</td>
                    <td style={S.tdR}>{fmtNum(item.nhapKhac) || ""}</td>
                    <td style={S.tdR}>{hasAny ? fmtNum(tx) : ""}</td>
                    <td style={{ ...S.tdR, color: "#7c2d12" }}>{fmtNum(item.xuatSX) || ""}</td>
                    <td style={S.tdR}>{fmtNum(item.xuatKhac) || ""}</td>
                    <td style={{ ...S.tdR, fontWeight: hasAny ? 600 : 400 }}>{hasAny ? fmtNum(tc) : ""}</td>
                  </tr>
                );
              }),
            ];
          })}
        </tbody>
      </table>

      <div style={{ marginTop: 20, textAlign: "right", fontStyle: "italic", fontSize: 10 }}>
        Đèo Nai, ngày {today.getDate()} tháng {today.getMonth() + 1} năm {today.getFullYear()}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center", gap: 8, marginTop: 14 }}>
        {["NGƯỜI LẬP BIỂU", "TRƯỞNG PHÒNG KẾ HOẠCH", "GIÁM ĐỐC CÔNG TY"].map((title) => (
          <div key={title} style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 10 }}>{title}</div>
            <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>(Ký, ghi rõ họ tên)</div>
            <div style={{ marginTop: 52, borderBottom: "1px solid #000", width: "60%", margin: "52px auto 0" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── VAT TU MODAL ─────────────────────────────────────────────────────────────
function VatTuModal({ onClose }: { onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=1200,height=900");
    if (!win || !printRef.current) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Báo cáo Luân chuyển Vật tư</title><style>@page{size:A3 landscape;margin:8mm;}*{box-sizing:border-box;}body{margin:0;padding:0;font-family:"Times New Roman",serif;}</style></head><body>${printRef.current.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "10px 20px", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1976D2" }}>Báo cáo Luân chuyển Vật tư — Quý I/2026</div>
        </div>
        <button onClick={handlePrint} style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          🖨 In / Lưu PDF
        </button>
        <button onClick={onClose} style={{ background: "#f3f4f6", color: "#1976D2", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>
          ✕ Đóng
        </button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "24px", background: "#9ca3af", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 1050, boxShadow: "0 8px 40px rgba(0,0,0,0.35)", background: "#fff" }}>
          <VatTuPaper printRef={printRef} />
        </div>
      </div>
    </div>
  );
}

// ─── PLAN MODAL ───────────────────────────────────────────────────────────────
function PlanModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (plan: any) => void }) {
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
    { type: "ke-hoach-san-xuat", icon: "📊", label: "Kế hoạch sản xuất", sub: "Than, mét lò, CBSX..." },
    { type: "ke-hoach-nhan-su", icon: "👷", label: "Kế hoạch nhân sự", sub: "Lao động, ca làm việc..." },
    { type: "ke-hoach-vat-tu", icon: "📦", label: "Kế hoạch vật tư", sub: "Nhập - xuất - tồn kho..." },
    { type: "ke-hoach-tai-chinh", icon: "💰", label: "Kế hoạch tài chính", sub: "Chi phí, doanh thu..." },
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!dept) { alert("Vui lòng chọn phòng ban"); return; }
      if (!planType) { alert("Vui lòng chọn loại kế hoạch"); return; }
    }
    setStep((s) => Math.min(s + 1, 3));
  };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      onSubmit({ dept, type: PLAN_TYPE_MAP[planType] || planType, period, target });
    }, 1800);
  };

  const stepTabStyle = (n: number): React.CSSProperties => ({
    flex: 1, textAlign: "center", padding: "8px 4px", fontSize: 10, fontWeight: 700,
    background: step === n ? "#eff6ff" : step > n ? "#ecfdf5" : "#f1f5f9",
    color: step === n ? "#1d4ed8" : step > n ? "#059669" : "#94a3b8",
    borderBottom: `2px solid ${step === n ? "#3b82f6" : step > n ? "#10b981" : "#e2e8f0"}`,
  });

  const inp = { width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "7px 10px", fontSize: 12, fontFamily: "inherit", outline: "none" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 40 }}>
      <div style={{ background: "#fff", borderRadius: 12, width: 620, maxWidth: "96vw", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>

        {/* Header */}
        <div style={{ background: "#1d4ed8", color: "#fff", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>+ Lập kế hoạch mới</div>
            <div style={{ fontSize: 10, opacity: 0.8, marginTop: 1 }}>Tự động gắn vào Báo cáo nội bộ & Báo cáo TKV</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 5, padding: "4px 10px", cursor: "pointer", fontSize: 13 }}>✕</button>
        </div>

        {/* Step bar */}
        <div style={{ display: "flex" }}>
          {["1. Chọn phòng ban & loại", "2. Nhập / tải lên", "3. Xác nhận & gửi"].map((label, i) => (
            <div key={i} style={stepTabStyle(i + 1)}>{label}</div>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: 20, maxHeight: "65vh", overflowY: "auto" }}>

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#1976D2", display: "block", marginBottom: 5 }}>Phòng ban *</label>
                <select value={dept} onChange={(e) => setDept(e.target.value)} style={inp}>
                  <option value="">-- Chọn phòng ban --</option>
                  {DEPTS.slice(1).map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#1976D2", display: "block", marginBottom: 8 }}>Loại kế hoạch *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {planCards.map((pc) => (
                    <div
                      key={pc.type}
                      onClick={() => setPlanType(pc.type)}
                      style={{
                        border: planType === pc.type ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                        background: planType === pc.type ? "#eff6ff" : "#fff",
                        borderRadius: 8, padding: "10px 12px", display: "flex", alignItems: "center",
                        gap: 10, cursor: "pointer", transition: "border-color .15s",
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 7, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{pc.icon}</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12 }}>{pc.label}</div>
                        <div style={{ fontSize: 10, color: "#64748b" }}>{pc.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#1976D2", display: "block", marginBottom: 5 }}>Kỳ kế hoạch</label>
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} style={inp}>
                    <option>Tháng 4/2026</option>
                    <option>Tháng 5/2026</option>
                    <option>Quý II/2026</option>
                    <option>Năm 2026</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#1976D2", display: "block", marginBottom: 5 }}>Gắn vào báo cáo</label>
                  <select value={target} onChange={(e) => setTarget(e.target.value)} style={inp}>
                    <option value="both">Nội bộ + TKV</option>
                    <option value="noidung">Chỉ báo cáo nội bộ</option>
                    <option value="tkv">Chỉ báo cáo TKV</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {["upload", "form"].map((m) => (
                  <button key={m} onClick={() => setInputMode(m)} style={{
                    background: inputMode === m ? "#1d4ed8" : "#f3f4f6",
                    color: inputMode === m ? "#fff" : "#1976D2",
                    border: inputMode === m ? "none" : "1px solid #d1d5db",
                    borderRadius: 7, padding: "6px 14px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                  }}>
                    {m === "upload" ? "📂 Tải lên Excel" : "✏️ Nhập tay"}
                  </button>
                ))}
              </div>

              {inputMode === "upload" && (
                <>
                  <div
                    onClick={() => setUploadedFile(`KH_${(PLAN_TYPE_MAP[planType] || "").replace(/\s/g, "_")}_${period.replace(/\//g, "_")}.xlsx`)}
                    style={{ border: "2px dashed #93c5fd", borderRadius: 8, padding: 24, textAlign: "center", background: "#eff6ff", cursor: "pointer" }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>Kéo thả hoặc bấm để tải file Excel</div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Hỗ trợ .xlsx, .xls — tối đa 10MB</div>
                    {uploadedFile && <div style={{ marginTop: 8, fontSize: 11, color: "#059669", fontWeight: 700 }}>✓ Đã chọn: {uploadedFile}</div>}
                  </div>
                  <div style={{ marginTop: 10, padding: "8px 10px", background: "#f0f9ff", borderRadius: 6, fontSize: 10, color: "#0369a1" }}>
                    Tải mẫu Excel: <span style={{ textDecoration: "underline", cursor: "pointer", color: "#1d4ed8" }} onClick={() => alert("Đang tải mẫu...")}>
                      Mẫu {PLAN_TYPE_MAP[planType] || "kế hoạch"}.xlsx
                    </span>
                  </div>
                </>
              )}

              {inputMode === "form" && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#1976D2", marginBottom: 8 }}>Nhập chỉ tiêu kế hoạch</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Chỉ tiêu", "ĐVT", "Kế hoạch tháng", "Kế hoạch năm"].map((h) => (
                          <th key={h} style={{ padding: "5px 7px", border: "1px solid #9ca3af", fontSize: 10, fontWeight: 700, background: "#1976D2", color: "#fff", textAlign: "center" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {["Than nguyên khai", "Mét lò đào mới", "XDCB", "CBSX"].map((row, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                          <td style={{ padding: "5px 7px", border: "1px solid #d1d5db", fontSize: 11 }}>{row}</td>
                          <td style={{ padding: "5px 7px", border: "1px solid #d1d5db", fontSize: 11, textAlign: "center" }}>{i === 0 ? "Tấn" : "m"}</td>
                          <td style={{ padding: "5px 7px", border: "1px solid #d1d5db" }}><input style={{ ...inp, padding: "3px 6px", fontSize: 11 }} placeholder="0" /></td>
                          <td style={{ padding: "5px 7px", border: "1px solid #d1d5db" }}><input style={{ ...inp, padding: "3px 6px", fontSize: 11 }} placeholder="0" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <>
              {!submitted && !submitting && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#065f46", marginBottom: 10 }}>Xác nhận thông tin kế hoạch</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    {[
                      ["Phòng ban:", dept],
                      ["Loại kế hoạch:", PLAN_TYPE_MAP[planType] || ""],
                      ["Kỳ:", period],
                      ["Gắn vào:", REPORT_TARGET_MAP[target]],
                      ["Nguồn dữ liệu:", inputMode === "upload" ? (uploadedFile || "File chưa chọn") : "Nhập tay qua form"],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td style={{ border: "none", fontSize: 11, color: "#1976D2", padding: "4px 0", width: 140 }}>{label}</td>
                        <td style={{ border: "none", fontSize: 11, fontWeight: 700 }}>{value}</td>
                      </tr>
                    ))}
                  </table>
                </div>
              )}

              {submitting && (
                <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 7, padding: 16, textAlign: "center", fontSize: 12, color: "#1d4ed8" }}>
                  <div style={{ fontSize: 20, marginBottom: 6, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
                  <div>Đang tạo kế hoạch và gắn vào báo cáo...</div>
                </div>
              )}

              {submitted && (
                <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 7, padding: 16, fontSize: 12, color: "#065f46", textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>Tạo kế hoạch thành công!</div>
                  <div><b>{PLAN_TYPE_MAP[planType]}</b> — {dept} — {period}</div>
                  <div style={{ marginTop: 4, fontSize: 11 }}>Đã gắn vào: <b>{REPORT_TARGET_MAP[target]}</b></div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          {step > 1 && !submitted && (
            <button onClick={() => setStep((s) => s - 1)} style={{ background: "#f3f4f6", color: "#1976D2", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              ← Quay lại
            </button>
          )}
          {step < 3 && (
            <button onClick={handleNext} style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 7, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Tiếp theo →
            </button>
          )}
          {step === 3 && !submitted && !submitting && (
            <button onClick={handleSubmit} style={{ background: "#059669", color: "#fff", border: "none", borderRadius: 7, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Tạo kế hoạch & Gắn vào báo cáo
            </button>
          )}
          {submitted && (
            <button onClick={onClose} style={{ background: "#059669", color: "#fff", border: "none", borderRadius: 7, padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              Đóng ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PLAN BADGE ───────────────────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: any }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderLeft: "3px solid #1d4ed8", borderRadius: 0, padding: "5px 8px", marginBottom: 5, display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1976D2" }}>{plan.type}</div>
        <div style={{ fontSize: 9, color: "#64748b" }}>{plan.dept} — {plan.period}</div>
      </div>
      <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8" }}>Đã gắn</span>
    </div>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────────────────────
function KPICard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#1976D2", color: "#fff", padding: "6px 12px", fontSize: 10, fontWeight: 700, textAlign: "center", letterSpacing: "0.3px" }}>
        {title}
      </div>
      <div style={{ padding: 14, flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// ─── SECTION CARD ─────────────────────────────────────────────────────────────
function SectionCard({ title, titleBg = "#1976D2", children }: { title: string; titleBg?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
      <div style={{ background: titleBg, color: "#fff", padding: "6px 12px", fontSize: 10, fontWeight: 700, textAlign: "center", letterSpacing: "0.3px" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

// ─── STATUS DOT ───────────────────────────────────────────────────────────────
function StatusDot({ ok }: { ok: boolean }) {
  return <div style={{ width: 7, height: 7, borderRadius: "50%", background: ok ? "#10b981" : "#f59e0b", flexShrink: 0 }} />;
}

// ─── BADGE ────────────────────────────────────────────────────────────────────
function Badge({ children, color = "#1d4ed8", bg = "#eff6ff" }: { children: React.ReactNode; color?: string; bg?: string }) {
  return (
    <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 700, background: bg, color }}>{children}</span>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = "#2563eb" }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#94a3b8", marginBottom: 2 }}>
        <span>KH: {fmtNum(max)}</span>
        <span style={{ color, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 5, background: "#e2e8f0", borderRadius: 4 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}

// ─── TH / TD helpers ─────────────────────────────────────────────────────────
const TH = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding: "5px 7px", border: "1px solid #9ca3af", fontSize: 10,
  fontWeight: 700, background: "#1976D2", color: "#fff", textAlign: "center" as const, ...extra,
});
const TD = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding: "6px 7px", border: "1px solid #d1d5db", fontSize: 11, ...extra,
});

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function CoalMiningDashboard() {
  const today = new Date();
  const todayISO = today.toISOString().split("T")[0];

  // ── State ──
  const [timePeriod, setTimePeriod] = useState("Ngày");
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [deptFilter, setDeptFilter] = useState("Tất cả");
  const [viewLevel, setViewLevel] = useState("Cấp 2 — Công ty");

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showVattuModal, setShowVattuModal] = useState(false);
  const [plans, setPlans] = useState<PlanEntry[]>([]);


  const [etlStatus, setEtlStatus] = useState("idle"); // "idle" | "running" | "done" | "error"
  const [syncLog, setSyncLog] = useState(MOCK_SYNC_LOG);
  const [syncing, setSyncing] = useState(false);

  // Derived
  const displayDate = new Date(selectedDate);
  const dayStr = `${String(displayDate.getDate()).padStart(2, "0")}/${String(displayDate.getMonth() + 1).padStart(2, "0")}/${displayDate.getFullYear()}`;

  const handlePlanSubmit = useCallback((plan: any) => {
    setPlans((prev) => [...prev, plan]);
  }, []);

  const handleSync = () => {
    setSyncing(true);
    setEtlStatus("running");
    setTimeout(() => {
      setSyncing(false);
      setEtlStatus("done");
      const now = new Date();
      const ts = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      setSyncLog((prev) => [{ ts, noidung: "PX Than NK + PX Than Sạch", ok: true }, ...prev]);
    }, 3000);
  };

  const pipeColor = { idle: "#9ca3af", running: "#2563eb", done: "#059669", error: "#dc2626" }[etlStatus];
  const noidungPlans = plans.filter((p) => p.target === "both" || p.target === "noidung");
  const tkvPlans = plans.filter((p) => p.target === "both" || p.target === "tkv");

  const pipelines = [
    { icon: "⛏", label: "ETL — PX Than Nguyên Khai", sub: "DB (192.168.1.100) → Staging" },
    { icon: "🔩", label: "ETL — PX Than Sạch", sub: "DB (192.168.1.102) → Staging" },
    { icon: "✔", label: "Validate & Transform", sub: "Kiểm tra chỉ tiêu, chuyển đổi định dạng" },
    { icon: "📋", label: "Tổng hợp → Báo cáo TKV", sub: "Staging → Báo cáo nội bộ + TKV" },
  ];

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#f1f5f9;font-family:'Segoe UI',system-ui,sans-serif;color:#1f2937;font-size:13px;}
        .fbtn{background:#e2e8f0;border:none;padding:5px 11px;border-radius:5px;cursor:pointer;font-size:11px;font-family:inherit;color:#1976D2;font-weight:500;transition:all .12s;}
        .fbtn.on{background:#1976D2;color:#fff;}
        .fbtn:hover:not(.on){background:#cbd5e1;}
        tbody tr:hover td{background:#eff6ff!important;}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>

        {/* ═══ HEADER ═══ */}
        <div style={{ background: "#fff", borderBottom: "3px solid #0d47a1", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: "#1f2937" }}>BÁO CÁO ĐIỀU HÀNH SẢN XUẤT & NHÂN SỰ</h1>
            <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>
              {COMPANY_NAME} — Cập nhật: {dayStr}
            </div>
          </div>
          <button
            onClick={() => setShowPlanModal(true)}
            style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
          >
            + Lập kế hoạch
          </button>
        </div>

        {/* ═══ FILTER BAR ═══ */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "8px 16px", display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          {/* Time period toggles */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>Kỳ:</span>
            {["Ngày", "Tuần", "Tháng"].map((f) => (
              <button key={f} className={`fbtn${timePeriod === f ? " on" : ""}`} onClick={() => setTimePeriod(f)}>{f}</button>
            ))}
          </div>

          {/* Date picker */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>Ngày:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontFamily: "inherit", color: "#1f2937", cursor: "pointer" }}
            />
          </div>

          {/* Department select */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>Phòng ban:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontFamily: "inherit", color: "#1f2937" }}
            >
              {DEPTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* View level */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>Cấp xem:</span>
            <select
              value={viewLevel}
              onChange={(e) => setViewLevel(e.target.value)}
              style={{ border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontFamily: "inherit", color: "#1f2937" }}
            >
              <option>Cấp 1 — Phòng ban</option>
              <option>Cấp 2 — Công ty</option>
              <option>Cấp 3 — Tập đoàn TKV</option>
              <option>Cấp 4 — Bộ ngành</option>
            </select>
          </div>
        </div>

        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>

          {/* ═══ ROW 1: KPI CARDS ═══ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>

            {/* KPI 1 — Than NK */}
            <KPICard title="TỔNG THAN NGUYÊN KHAI LŨY KẾ (TẤN)">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", fontFamily: "monospace", lineHeight: 1 }}>
                    {fmtNum(28981)}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 5, color: "#64748b" }}>
                    Hôm nay <b style={{ color: "#2563eb" }}>{fmtNum(6917)} tấn</b>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <ProgressBar value={28981} max={30000} color="#2563eb" />
                    <div style={{ fontSize: 9, color: "#059669", fontWeight: 700, marginTop: 2 }}>▲ 5,2% so với cùng kỳ</div>
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                    <Badge bg="#f0f9ff" color="#0369a1">PX Than NK: 6.917</Badge>
                    <Badge bg="#f0fdf4" color="#059669">PX Than Sạch: 4.120</Badge>
                  </div>
                </div>
                <div style={{ textAlign: "center", marginLeft: 10, flexShrink: 0 }}>
                  <Sparkline data={[900, 1050, 1100, 980, 1150, 1080, 1200]} color="#2563eb" />
                  <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>7 ngày qua</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#f59e0b", fontFamily: "monospace", marginTop: 4 }}>8,5%</div>
                  <div style={{ fontSize: 9, color: "#94a3b8" }}>Chất lượng (Ak)</div>
                </div>
              </div>
            </KPICard>

            {/* KPI 2 — Mét lò */}
            <KPICard title="MÉT ĐÀO LÒ MỚI LŨY KẾ (MÉT)">
              <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", fontFamily: "monospace", lineHeight: 1 }}>
                {fmtNum(581.1)}
              </div>
              <div style={{ fontSize: 11, marginTop: 5, color: "#64748b" }}>
                Hôm nay <b style={{ color: "#1976D2" }}>{fmtNum(3140)} m</b>
              </div>
              <div style={{ marginTop: 8 }}>
                <ProgressBar value={581.1} max={600} color="#1a56db" />
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
                <Badge>XDCB: 310 m</Badge>
                <Badge>CBSX: 2.520 m</Badge>
                <Badge bg="#f9fafb" color="#6b7280">Mò xén: 105 m</Badge>
              </div>
            </KPICard>

            {/* KPI 3 — Nhân lực */}
            <KPICard title="TỔNG NHÂN LỰC">
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", fontFamily: "monospace", lineHeight: 1 }}>
                  {fmtNum(WORKFORCE.total)}
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>tổng biên chế</div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ background: "#1976D2", color: "#fff", borderRadius: 7, padding: "4px 12px", fontSize: 20, fontWeight: 800, fontFamily: "monospace" }}>
                  {WORKFORCE.diLam}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Badge>Thợ lò: {WORKFORCE.diLamBreakdown.thoLo}</Badge>
                  <Badge bg="#fffbeb" color="#d97706">Điện cơ: {WORKFORCE.diLamBreakdown.dienCo}</Badge>
                  <Badge bg="#ecfdf5" color="#059669">BCH: {WORKFORCE.diLamBreakdown.bch}</Badge>
                </div>
              </div>
              <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                <Badge bg="#fef2f2" color="#dc2626">Vắng: {WORKFORCE.vang}</Badge>
                <Badge bg="#f3f4f6" color="#6b7280">Nghỉ: {WORKFORCE.nghi}</Badge>
                <Badge bg="#f3f4f6" color="#6b7280">Lũy kế nghỉ: {WORKFORCE.nghiLuyKe}</Badge>
              </div>
            </KPICard>
          </div>

          {/* ═══ ROW 2: WORKER TABLE + PRODUCTION ═══ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, alignItems: "start" }}>

            {/* Worker Table */}
            <SectionCard title="BẢNG CÔNG NHÂN LỰC CHI TIẾT">
              <div style={{ overflowX: "auto", padding: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th rowSpan={2} style={TH({ minWidth: 110, textAlign: "left" })}>Nhân lực</th>
                      <th rowSpan={2} style={TH({ width: 30 })}>Ô</th>
                      <th rowSpan={2} style={TH({ width: 30 })}>F</th>
                      <th rowSpan={2} style={TH({ width: 30 })}>TT</th>
                      <th colSpan={4} style={TH({ background: "#d97706" })}>Đi làm</th>
                      <th rowSpan={2} style={TH({ background: "#dc2626", minWidth: 60 })}>T.Lò vắng</th>
                      <th rowSpan={2} style={TH({ background: "#dc2626", minWidth: 65 })}>C.Điện vắng</th>
                    </tr>
                    <tr>
                      {["T.Lò", "Điện", "Cơ", "BCH"].map((h) => (
                        <th key={h} style={TH({ background: "#b45309", width: 36, fontSize: 10 })}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {WORKER_TABLE.map((row, i) => {
                      const rowBg = row.hl === "amber" ? "#fef9c3" : row.hl === "blue" ? "#eff6ff" : row.hl === "green" ? "#f0fdf4" : i % 2 === 0 ? "#f9fafb" : "#fff";
                      const nameColor = row.hl === "blue" ? "#1d4ed8" : row.hl === "green" ? "#059669" : "#1f2937";
                      return (
                        <tr key={i}>
                          <td style={TD({ fontWeight: 700, color: nameColor, background: rowBg })}>{row.nhanluc}</td>
                          <td style={TD({ textAlign: "center", background: rowBg })}>{row.o}</td>
                          <td style={TD({ textAlign: "center", background: rowBg, color: row.f === 0 && row.hl === "amber" ? "#dc2626" : undefined, fontWeight: row.f === 0 && row.hl === "amber" ? 800 : undefined })}>{row.f}</td>
                          <td style={TD({ textAlign: "center", background: rowBg })}>{row.tt}</td>
                          <td style={TD({ textAlign: "center", background: "#fef3c7", fontWeight: 700 })}>{row.tLo}</td>
                          <td style={TD({ textAlign: "center", background: "#fef3c7", fontWeight: 700 })}>{row.dien}</td>
                          <td style={TD({ textAlign: "center", background: "#fef3c7", fontWeight: 700 })}>{row.co}</td>
                          <td style={TD({ textAlign: "center", background: "#fef3c7", fontWeight: 700 })}>{row.bch}</td>
                          <td style={TD({ textAlign: "center", background: rowBg, color: row.tLoVang ? "#dc2626" : "#1f2937", fontWeight: row.tLoVang ? 800 : 400 })}>{row.tLoVang}</td>
                          <td style={TD({ textAlign: "center", background: rowBg, color: row.cdienVang === 0 ? "#059669" : "#1f2937", fontWeight: row.cdienVang === 0 ? 700 : 400 })}>{row.cdienVang === 0 ? "0" : (row.cdienVang ?? "")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            {/* Production Table */}
            <SectionCard title="KẾT QUẢ SẢN XUẤT HÔM NAY VS LŨY KẾ">
              <div style={{ padding: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      {["Chỉ tiêu", "ĐV", "Hôm nay", "Lũy kế", "KH tháng", "Tỷ lệ"].map((h) => (
                        <th key={h} style={TH({ fontSize: 10, padding: "5px 6px" })}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {PRODUCTION_TABLE.map((row, i) => {
                      const pct = row.kh ? Math.round((row.luyKe / row.kh) * 100) : 0;
                      const pctColor = pct >= 95 ? "#059669" : pct >= 80 ? "#d97706" : "#dc2626";
                      return (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                          <td style={TD({ fontWeight: 500, fontSize: 11 })}>{row.chiTieu}</td>
                          <td style={TD({ textAlign: "center", color: "#6b7280", fontSize: 10 })}>{row.dvj}</td>
                          <td style={TD({ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#1976D2" })}>{fmtNum(row.homNay)}</td>
                          <td style={TD({ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#1a56db" })}>{fmtNum(row.luyKe)}</td>
                          <td style={TD({ textAlign: "right", fontFamily: "monospace", color: "#6b7280" })}>{fmtNum(row.kh)}</td>
                          <td style={TD({ textAlign: "center", fontWeight: 700, color: pctColor, fontSize: 11 })}>{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          {/* ═══ ROW 3: BÁO CÁO NỘI BỘ + TKV ═══ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>

            {/* A — Báo cáo nội bộ */}
            <SectionCard title="A. BÁO CÁO NỘI BỘ — TỪ CÁC PHÂN XƯỞNG" titleBg="#1976D2">
              <div style={{ padding: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>Phân xưởng:</span>
                  <select style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 8px", fontSize: 11 }}>
                    <option>Tất cả phân xưởng</option>
                    <option>PX Than Nguyên Khai</option>
                    <option>PX Than Sạch</option>
                    <option>PX Cơ điện</option>
                  </select>
                </div>

                {/* PX Than NK row */}
                {[
                  { icon: "⛏", color: "#1d4ed8", bg: "#eff6ff", name: "PX Than Nguyên Khai", syncTime: `Ngày ${dayStr} lúc 08:30`, badges: [{ label: "Đã đồng bộ", c: "#059669", bg: "#ecfdf5" }, { label: "6.917 tấn", c: "#1d4ed8", bg: "#eff6ff" }] },
                  { icon: "🔩", color: "#059669", bg: "#ecfdf5", name: "PX Than Sạch", syncTime: `Ngày ${dayStr} lúc 09:15`, badges: [{ label: "Đã đồng bộ", c: "#059669", bg: "#ecfdf5" }, { label: "4.120 tấn", c: "#1d4ed8", bg: "#eff6ff" }, { label: "Chờ xác nhận", c: "#dc2626", bg: "#fef2f2" }] },
                ].map((item) => (
                  <div key={item.name} style={{ border: "1px solid #e5e7eb", borderLeft: `3px solid ${item.color}`, borderRadius: 0, padding: "8px 10px", marginBottom: 8, display: "flex", alignItems: "center", gap: 8, background: item.bg }}>
                    <div style={{ width: 32, height: 32, background: "#fff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: item.color }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>Đồng bộ lần cuối: <b>{item.syncTime}</b></div>
                      <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                        {item.badges.map((b) => <span key={b.label} style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, fontWeight: 700, background: b.bg, color: b.c }}>{b.label}</span>)}
                      </div>
                    </div>
                    <button className="fbtn" style={{ fontSize: 10 }}>Xem</button>
                  </div>
                ))}

                {/* Tài chính & Vật tư nội bộ */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                  {[
                    { label: "Doanh thu ngày", value: "550 Tỷ VNĐ", color: "#059669" },
                    { label: "Lợi nhuận ngày", value: "275 Tỷ VNĐ", color: "#1d4ed8" },
                    { label: "Giá thành/Tấn", value: "24.932 VNĐ", color: "#d97706" },
                    { label: "Tồn vật tư", value: "1.200 Tr VNĐ", color: "#6b7280" },
                  ].map((m) => (
                    <div key={m.label} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 6, padding: "6px 10px" }}>
                      <div style={{ fontSize: 9, color: "#94a3b8" }}>{m.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: m.color, fontFamily: "monospace" }}>{m.value}</div>
                    </div>
                  ))}
                </div>

                {/* Kế hoạch nội bộ */}
                <div style={{ padding: "8px 10px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 7 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#0369a1", marginBottom: 6 }}>KẾ HOẠCH ĐÃ GẮN</div>
                  {noidungPlans.length === 0
                    ? <div style={{ fontSize: 10, color: "#64748b", fontStyle: "italic" }}>Chưa có kế hoạch. Nhấn "+ Lập kế hoạch" để tạo.</div>
                    : noidungPlans.map((p, i) => <PlanBadge key={i} plan={p} />)
                  }
                </div>
              </div>
            </SectionCard>

            {/* B — Báo cáo TKV */}
            <SectionCard title="B. BÁO CÁO TKV — TỔNG HỢP GỬI TẬP ĐOÀN" titleBg="#1976D2">
              <div style={{ padding: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>Loại báo cáo:</span>
                  <select style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 8px", fontSize: 11 }}>
                    <option>Báo cáo sản lượng (Mẫu TKV)</option>
                    <option>Báo cáo lao động (Mẫu TKV)</option>
                    <option>Báo cáo tổng hợp (Mẫu TKV)</option>
                  </select>
                </div>

                {/* TKV summary box */}
                <div style={{ border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px", background: "#f0fdf4", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#065f46", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    Báo cáo Than — Ngày {dayStr}
                    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, fontWeight: 700, background: "#dcfce7", color: "#15803d" }}>Đủ dữ liệu</span>
                  </div>
                  {[
                    { dept: "PX Than Nguyên Khai", value: "6.917 tấn", ok: true },
                    { dept: "PX Than Sạch", value: "4.120 tấn", ok: true },
                  ].map((row) => (
                    <div key={row.dept} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, background: "#fff", borderRadius: 5, padding: "5px 8px", marginBottom: 4 }}>
                      <StatusDot ok={row.ok} />
                      <span style={{ flex: 1, color: "#1976D2" }}>{row.dept} — Ngày {dayStr}</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8" }}>{row.value}</span>
                    </div>
                  ))}
                  {/* Grand total */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", background: "#d1fae5", borderRadius: 5, fontWeight: 700, fontSize: 11, marginTop: 4 }}>
                    <span style={{ color: "#065f46" }}>Tổng hợp TKV — Ngày {dayStr}</span>
                    <span style={{ fontFamily: "monospace", color: "#1976D2" }}>11.037 tấn</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <button
                      onClick={() => setShowVattuModal(true)}
                      style={{ background: "#059669", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Xuất Excel / PDF
                    </button>
                    <button className="fbtn" style={{ fontSize: 11 }}>Xem trước</button>
                  </div>
                </div>

                {/* Pending data */}
                <div style={{ border: "1px solid #fde68a", borderRadius: 7, padding: "8px 10px", background: "#fffbeb", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", marginBottom: 5 }}>CÒN CHỜ DỮ LIỆU</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10 }}>
                    <StatusDot ok={false} />
                    <span style={{ flex: 1 }}>PX Than Sạch — Ngày tiếp theo</span>
                    <span style={{ color: "#d97706", fontWeight: 700 }}>Chưa đồng bộ</span>
                  </div>
                </div>

                {/* Kế hoạch TKV */}
                <div style={{ padding: "8px 10px", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 7 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#9a3412", marginBottom: 6 }}>KẾ HOẠCH ĐÃ GẮN VÀO BÁO CÁO TKV</div>
                  {tkvPlans.length === 0
                    ? <div style={{ fontSize: 10, color: "#64748b", fontStyle: "italic" }}>Chưa có kế hoạch. Nhấn "+ Lập kế hoạch" để tạo.</div>
                    : tkvPlans.map((p, i) => <PlanBadge key={i} plan={p} />)
                  }
                </div>
              </div>
            </SectionCard>
          </div>

          {/* ═══ ROW 4: ETL PIPELINE ═══ */}
          <SectionCard title="ĐỒNG BỘ DỮ LIỆU TỪ CÁC PHÂN XƯỞNG → PIPELINE ETL → BÁO CÁO TKV" titleBg="#1976D2">
            <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "260px 1fr 1fr", gap: 14 }}>

              {/* DB Config */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1976D2", marginBottom: 8 }}>Kết nối nguồn dữ liệu</div>
                {[
                  { label: "PX THAN NGUYÊN KHAI", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd", ip: "192.168.1.100" },
                  { label: "PX THAN SẠCH", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", ip: "192.168.1.102" },
                ].map((db) => (
                  <div key={db.label} style={{ background: db.bg, border: `1px solid ${db.border}`, borderRadius: 7, padding: 10, marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: db.color, marginBottom: 6 }}>{db.label}</div>
                    <input defaultValue={db.ip} style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 5, padding: "5px 8px", fontSize: 11, marginBottom: 4, fontFamily: "inherit" }} placeholder="IP Server" />
                    <input defaultValue="sa" style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 5, padding: "5px 8px", fontSize: 11, fontFamily: "inherit" }} placeholder="Username" />
                  </div>
                ))}
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  style={{ width: "100%", background: syncing ? "#6b7280" : "#1976D2", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 800, cursor: syncing ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {syncing
                    ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> Đang đồng bộ...</>
                    : "⬇ Đồng bộ tất cả"
                  }
                </button>
                <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 6, background: etlStatus === "done" ? "#ecfdf5" : etlStatus === "running" ? "#eff6ff" : "#f3f4f6", fontSize: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: pipeColor }} />
                  <span style={{ color: pipeColor, fontWeight: 700 }}>
                    {etlStatus === "done" ? "Đồng bộ hoàn thành" : etlStatus === "running" ? "Đang đồng bộ..." : "Chờ đồng bộ"}
                  </span>
                </div>
              </div>

              {/* Pipeline steps */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1976D2", marginBottom: 8 }}>ETL Pipeline Flow</div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {pipelines.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "#fff", borderRadius: 8, border: `1px solid ${pipeColor}33` }}>
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: pipeColor + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{p.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700 }}>{p.label}</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>{p.sub}</div>
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: pipeColor }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Sync log */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1976D2", marginBottom: 8 }}>Nhật ký đồng bộ</div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "85px 1fr 55px", padding: "5px 10px", background: "#1976D2" }}>
                    {["Thời gian", "Nội dung", "Trạng thái"].map((h) => (
                      <span key={h} style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>{h}</span>
                    ))}
                  </div>
                  <div style={{ maxHeight: 170, overflowY: "auto" }}>
                    {syncLog.map((row, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "85px 1fr 55px", padding: "5px 10px", background: i % 2 === 0 ? "#fff" : "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ fontSize: 9, color: "#6b7280", fontFamily: "monospace" }}>{row.ts}</span>
                        <span style={{ fontSize: 9 }}>{row.noidung}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: row.ok ? "#059669" : "#d97706" }}>{row.ok ? "✓ OK" : "⚠ Warn"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ═══ FOOTER ═══ */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", paddingBottom: 10 }}>
            <span>Dữ liệu cập nhật đến: {dayStr} 10:30</span>
            <span>Nguồn: Hệ thống sản xuất TKV</span>
            <span>Người cập nhật: Nguyễn Văn A</span>
            <span>Phiên bản: 2.1.0</span>
          </div>
        </div>
      </div>

      {/* ═══ MODALS ═══ */}
      {showPlanModal && (
        <PlanModal
          onClose={() => setShowPlanModal(false)}
          onSubmit={handlePlanSubmit}
        />
      )}
      {showVattuModal && (
        <VatTuModal onClose={() => setShowVattuModal(false)} />
      )}
    </>
  );
}