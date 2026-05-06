import { useState, useRef } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const COMPANY_NAME = "CÔNG TY CỔ PHẦN THAN ĐÈO NAI CỌC SÁU - VINACOMIN";
const COMPANY_DEPT = "PHÒNG KẾ HOẠCH - VẬT TƯ";
const BIEU_MAU = "BIỂU MẪU SỐ 01/VT";

const todayStr = new Date().toLocaleDateString("vi-VN", {
  weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
});
const todayDay = new Date().getDate();
const todayMonth = new Date().getMonth() + 1;
const todayYear = new Date().getFullYear();

// ─── TYPES ────────────────────────────────────────────────────────────────────
type EtlStatus = "idle" | "running" | "done" | "error";
type ReportTarget = "both" | "noidung" | "tkv";
type PlanType = "ke-hoach-san-xuat" | "ke-hoach-nhan-su" | "ke-hoach-vat-tu" | "ke-hoach-tai-chinh" | "";
type InputMode = "upload" | "form";

interface WorkerRow {
  nhanluc: string;
  o: number | string;
  f: number | string;
  tt: number | string;
  tLo: number | string;
  dien: number | string;
  co: number | string;
  bch: number | string;
  tLoVang: number | string;
  cdienVang: number | string;
  highlight?: boolean;
  blue?: boolean;
  green?: boolean;
}

interface PlanEntry {
  dept: string;
  type: string;
  period: string;
  target: ReportTarget;
}

interface VatTuItem {
  stt: number;
  maChiTieu: string;
  ten: string;
  tonDauKy: number | null;
  nhapTuMua: number | null;
  nhapKhac: number | null;
  xuatSX: number | null;
  xuatKhac: number | null;
  tonCuoiKy: number | null;
}

interface VatTuGroup {
  code: string;
  maChiTieu: string;
  tenNhom: string;
  items: VatTuItem[];
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK = {
  coalMTD: 28981,
  coalToday: 1200,
  coalQuality: 8.5,
  coal7Days: [900, 1050, 1100, 980, 1150, 1080, 1200],
  tunnelMTD: 581.1,
  tunnelToday: 10.0,
  workforce: {
    total: 1450, diLam: 29,
    diLamBreakdown: { thoLo: 29, dienCo: 15, bch: 7 },
    vang: 5, nghi: 1, nghiLuyKe: 16,
  },
  workerTable: [
    { nhanluc: "Phó QĐ trực ca", o: 1, f: 0, tt: 0, tLo: 29, dien: 15, co: 7, bch: 3, tLoVang: 3, cdienVang: 0, highlight: true },
    { nhanluc: "Thợ lò", o: 32, f: 1, tt: "", tLo: 29, dien: "", co: "", bch: "", tLoVang: 3, cdienVang: "", blue: true },
    { nhanluc: "Cơ điện", o: 15, f: "", tt: "", tLo: "", dien: 15, co: "", bch: "", tLoVang: "", cdienVang: 0, green: true },
    { nhanluc: "BCH, PVụ", o: "", f: "F:1", tt: "", tLo: "", dien: "", co: 7, bch: "", tLoVang: "", cdienVang: "" },
  ] as WorkerRow[],
  productionTable: [
    { chiTieu: "Than NK sản xuất", dvj: "Tấn", homNay: 6917, luyKe: 28981 },
    { chiTieu: "Mét lò đào mới (m)", dvj: "m", homNay: 3140, luyKe: 581.1 },
    { chiTieu: "XDCB (m)", dvj: "m", homNay: 310, luyKe: 71.4 },
    { chiTieu: "CBSX (m)", dvj: "m", homNay: 2520, luyKe: 452.9 },
    { chiTieu: "Mò xén (m)", dvj: "m", homNay: 105, luyKe: 56.8 },
  ],
  syncLog: [
    { ts: "05/04 08:30", noidung: "PX Than NK — Ngày 5", ok: true },
    { ts: "05/04 09:15", noidung: "PX Than Sạch — Ngày 5", ok: true },
    { ts: "04/04 08:20", noidung: "PX Than NK — Ngày 4", ok: true },
    { ts: "04/04 09:00", noidung: "PX Than Sạch — Ngày 4", ok: false },
  ],
};

// ─── VAT TU DATA ──────────────────────────────────────────────────────────────
const VATTU_DATA: { ky: number; nam: number; groups: VatTuGroup[] } = {
  ky: 1, nam: 2026,
  groups: [
    {
      code: "A", maChiTieu: "VL", tenNhom: "Vật liệu",
      items: [
        { stt: 1, maChiTieu: "5000000000001", ten: "Thuốc nổ và VLNCN", tonDauKy: 476838.21, nhapTuMua: 8418041.25, nhapKhac: 0, xuatSX: 8502048.73, xuatKhac: 0, tonCuoiKy: null },
        { stt: 2, maChiTieu: "5000000000002", ten: "Gỗ lò, gỗ các loại", tonDauKy: 478464.84, nhapTuMua: 3782310, nhapKhac: 155600, xuatSX: 3975936.79, xuatKhac: 375411.74, tonCuoiKy: null },
        { stt: 3, maChiTieu: "5000000000003", ten: "Thép lò, vì lò, phụ kiện vì chống lò", tonDauKy: 3151728.98, nhapTuMua: 25192141.75, nhapKhac: 4357294.73, xuatSX: 28103647.24, xuatKhac: 3666878.97, tonCuoiKy: null },
        { stt: 4, maChiTieu: "5000000000018", ten: "Phụ tùng SCTX", tonDauKy: 5480087.75, nhapTuMua: 17324953, nhapKhac: 194098.9, xuatSX: 8833380.38, xuatKhac: 1994979.35, tonCuoiKy: null },
        { stt: 5, maChiTieu: "5000000000022", ten: "Dầu mỡ phụ", tonDauKy: 1147737.65, nhapTuMua: 2749487.05, nhapKhac: 0, xuatSX: 2760818.28, xuatKhac: 45306.4, tonCuoiKy: null },
      ],
    },
    {
      code: "B", maChiTieu: "NL", tenNhom: "Nhiên liệu",
      items: [
        { stt: 1, maChiTieu: "5000000000025", ten: "Xăng, dầu", tonDauKy: 827758.85, nhapTuMua: 3688140.83, nhapKhac: null, xuatSX: 4471806.13, xuatKhac: 44093.55, tonCuoiKy: 0 },
        { stt: 2, maChiTieu: "5000000000026", ten: "Than", tonDauKy: null, nhapTuMua: null, nhapKhac: null, xuatSX: null, xuatKhac: null, tonCuoiKy: null },
      ],
    },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtNum = (n: number | null | undefined): string =>
  n == null ? "" : new Intl.NumberFormat("vi-VN").format(Math.round(n));

const PLAN_TYPE_MAP: Record<string, string> = {
  "ke-hoach-san-xuat": "Kế hoạch sản xuất",
  "ke-hoach-nhan-su": "Kế hoạch nhân sự",
  "ke-hoach-vat-tu": "Kế hoạch vật tư",
  "ke-hoach-tai-chinh": "Kế hoạch tài chính",
};

const REPORT_TARGET_MAP: Record<ReportTarget, string> = {
  both: "Báo cáo nội bộ + Báo cáo TKV",
  noidung: "Chỉ báo cáo nội bộ",
  tkv: "Chỉ báo cáo TKV",
};

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ data, color = "#1a56db" }: { data: number[]; color?: string }) {
  const w = 110, h = 36;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join("L");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <path d={`M${pts}L${w},${h}L0,${h}Z`} fill={color + "22"} />
      <path d={`M${pts}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── VAT TU PAPER ─────────────────────────────────────────────────────────────
function VatTuPaper({ printRef }: { printRef: React.RefObject<HTMLDivElement | null> }) {
  const S = {
    th: { border: "1px solid #000", padding: "3px 4px", fontSize: 8, fontWeight: 700, textAlign: "center" as const, verticalAlign: "middle" as const, background: "#e8edf7" },
    thDark: { border: "1px solid #000", padding: "3px 4px", fontSize: 8, fontWeight: 700, textAlign: "center" as const, verticalAlign: "middle" as const, background: "#c9d4e8" },
    td: { border: "1px solid #999", padding: "2px 4px", fontSize: 8, verticalAlign: "middle" as const },
    tdC: { border: "1px solid #999", padding: "2px 4px", fontSize: 8, verticalAlign: "middle" as const, textAlign: "center" as const },
    tdR: { border: "1px solid #999", padding: "2px 4px", fontSize: 8, verticalAlign: "middle" as const, textAlign: "right" as const },
    tdGroup: { border: "1px solid #888", padding: "3px 4px", fontSize: 8, fontWeight: 700, verticalAlign: "middle" as const, background: "#c9d4e8" },
    tdGroupR: { border: "1px solid #888", padding: "3px 4px", fontSize: 8, fontWeight: 700, verticalAlign: "middle" as const, background: "#c9d4e8", textAlign: "right" as const },
    tdTotal: { border: "1px solid #888", padding: "3px 4px", fontSize: 8, fontWeight: 700, verticalAlign: "middle" as const, background: "#e8edf7", textAlign: "right" as const },
  };
  const sumItems = (items: VatTuItem[], field: keyof VatTuItem) =>
    items.reduce((s, it) => s + ((it[field] as number) ?? 0), 0);
  const allItems = VATTU_DATA.groups.flatMap((g) => g.items);
  const grand = {
    tonDauKy: sumItems(allItems, "tonDauKy"),
    nhapTuMua: sumItems(allItems, "nhapTuMua"),
    nhapKhac: sumItems(allItems, "nhapKhac"),
    xuatSX: sumItems(allItems, "xuatSX"),
    xuatKhac: sumItems(allItems, "xuatKhac"),
  };
  const grandTongNhap = grand.nhapTuMua + grand.nhapKhac;
  const grandTongXuat = grand.xuatSX + grand.xuatKhac;
  const grandTonCuoi = grand.tonDauKy + grandTongNhap - grandTongXuat;

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
          <div>Năm: <b>{VATTU_DATA.nam}</b> — Kỳ: <b>Quý {VATTU_DATA.ky}</b></div>
          <div style={{ fontStyle: "italic", fontSize: 9 }}>ĐVT: Nghìn đồng</div>
        </div>
      </div>
      <div style={{ textAlign: "center", margin: "10px 0 8px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, textTransform: "uppercase" }}>Báo Cáo Tổng Hợp Luân Chuyển Vật Tư</div>
        <div style={{ fontWeight: 700, fontSize: 11, marginTop: 2 }}>(NHẬP - XUẤT - TỒN) — Quý {VATTU_DATA.ky} Năm {VATTU_DATA.nam}</div>
      </div>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th rowSpan={2} style={{ ...S.thDark, width: 25 }}>STT</th>
            <th rowSpan={2} style={{ ...S.thDark, width: 60 }}>Mã CT</th>
            <th rowSpan={2} style={{ ...S.thDark, minWidth: 150 }}>Tên vật tư</th>
            <th rowSpan={2} style={{ ...S.thDark, width: 70 }}>Tồn đầu kỳ</th>
            <th colSpan={3} style={S.thDark}>Nhập trong kỳ</th>
            <th colSpan={3} style={S.thDark}>Xuất trong kỳ</th>
            <th rowSpan={2} style={{ ...S.thDark, width: 70 }}>Tồn cuối kỳ</th>
          </tr>
          <tr>
            <th style={{ ...S.th, width: 70 }}>Tổng nhập</th>
            <th style={{ ...S.th, width: 70 }}>Từ mua</th>
            <th style={{ ...S.th, width: 70 }}>Từ khác</th>
            <th style={{ ...S.th, width: 70 }}>Tổng xuất</th>
            <th style={{ ...S.th, width: 70 }}>Xuất SX</th>
            <th style={{ ...S.th, width: 70 }}>Xuất khác</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={3} style={{ ...S.tdTotal, textAlign: "left" as const }}>TỔNG CỘNG</td>
            <td style={S.tdTotal}>{fmtNum(grand.tonDauKy)}</td>
            <td style={S.tdTotal}>{fmtNum(grandTongNhap)}</td>
            <td style={S.tdTotal}>{fmtNum(grand.nhapTuMua)}</td>
            <td style={S.tdTotal}>{fmtNum(grand.nhapKhac)}</td>
            <td style={S.tdTotal}>{fmtNum(grandTongXuat)}</td>
            <td style={S.tdTotal}>{fmtNum(grand.xuatSX)}</td>
            <td style={S.tdTotal}>{fmtNum(grand.xuatKhac)}</td>
            <td style={S.tdTotal}>{fmtNum(grandTonCuoi)}</td>
          </tr>
          {VATTU_DATA.groups.map((group) => {
            const gt = {
              tonDauKy: sumItems(group.items, "tonDauKy"),
              nhapTuMua: sumItems(group.items, "nhapTuMua"),
              nhapKhac: sumItems(group.items, "nhapKhac"),
              xuatSX: sumItems(group.items, "xuatSX"),
              xuatKhac: sumItems(group.items, "xuatKhac"),
            };
            const gtTongNhap = gt.nhapTuMua + gt.nhapKhac;
            const gtTongXuat = gt.xuatSX + gt.xuatKhac;
            const gtTonCuoi = gt.tonDauKy + gtTongNhap - gtTongXuat;
            return [
              <tr key={`g-${group.code}`}>
                <td style={{ ...S.tdGroup, textAlign: "center" as const }}>{group.code}</td>
                <td style={{ ...S.tdGroup, textAlign: "center" as const }}>{group.maChiTieu}</td>
                <td style={{ ...S.tdGroup, fontStyle: "italic" }}>{group.tenNhom}</td>
                <td style={S.tdGroupR}>{fmtNum(gt.tonDauKy)}</td>
                <td style={S.tdGroupR}>{fmtNum(gtTongNhap)}</td>
                <td style={S.tdGroupR}>{fmtNum(gt.nhapTuMua)}</td>
                <td style={S.tdGroupR}>{fmtNum(gt.nhapKhac)}</td>
                <td style={S.tdGroupR}>{fmtNum(gtTongXuat)}</td>
                <td style={S.tdGroupR}>{fmtNum(gt.xuatSX)}</td>
                <td style={S.tdGroupR}>{fmtNum(gt.xuatKhac)}</td>
                <td style={S.tdGroupR}>{fmtNum(gtTonCuoi)}</td>
              </tr>,
              ...group.items.map((item, idx) => {
                const tongNhap = (item.nhapTuMua ?? 0) + (item.nhapKhac ?? 0);
                const tongXuat = (item.xuatSX ?? 0) + (item.xuatKhac ?? 0);
                const tonCuoi = (item.tonDauKy ?? 0) + tongNhap - tongXuat;
                const hasAny = item.tonDauKy != null || item.nhapTuMua != null || item.xuatSX != null;
                return (
                  <tr key={item.maChiTieu} style={{ background: idx % 2 === 0 ? "#fff" : "#f8f9fc" }}>
                    <td style={S.tdC}>{item.stt}</td>
                    <td style={{ ...S.tdC, fontSize: 7 }}>{item.maChiTieu}</td>
                    <td style={S.td}>{item.ten}</td>
                    <td style={S.tdR}>{fmtNum(item.tonDauKy)}</td>
                    <td style={S.tdR}>{hasAny ? fmtNum(tongNhap) : ""}</td>
                    <td style={{ ...S.tdR, color: "#14532d" }}>{fmtNum(item.nhapTuMua)}</td>
                    <td style={S.tdR}>{fmtNum(item.nhapKhac)}</td>
                    <td style={S.tdR}>{hasAny ? fmtNum(tongXuat) : ""}</td>
                    <td style={{ ...S.tdR, color: "#7c2d12" }}>{fmtNum(item.xuatSX)}</td>
                    <td style={S.tdR}>{fmtNum(item.xuatKhac)}</td>
                    <td style={{ ...S.tdR, fontWeight: hasAny ? 600 : 400 }}>{hasAny ? fmtNum(tonCuoi) : ""}</td>
                  </tr>
                );
              }),
            ];
          })}
        </tbody>
      </table>
      <div style={{ marginTop: 20, textAlign: "right", fontStyle: "italic", fontSize: 10 }}>
        Đèo Nai, ngày {todayDay} tháng {todayMonth} năm {todayYear}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center", gap: 8, marginTop: 12 }}>
        {[{ title: "NGƯỜI LẬP BIỂU" }, { title: "TRƯỞNG PHÒNG KẾ HOẠCH" }, { title: "GIÁM ĐỐC CÔNG TY" }].map((sig, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>{sig.title}</div>
            <div style={{ fontSize: 9, color: "#555", marginTop: 2 }}>(Ký, ghi rõ họ tên)</div>
            <div style={{ marginTop: 52, borderBottom: "1px solid #000", width: "60%", margin: "52px auto 0" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── VAT TU MODAL ─────────────────────────────────────────────────────────────
function SyncPdfModal({ onClose }: { onClose: () => void }) {
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
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e3a5f" }}>Báo cáo Luân chuyển Vật tư — Quý {VATTU_DATA.ky}/{VATTU_DATA.nam}</div>
        </div>
        <button onClick={handlePrint} style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 7, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>🖨 In / Lưu PDF</button>
        <button onClick={onClose} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 14px", fontSize: 12, cursor: "pointer" }}>✕ Đóng</button>
      </div>
      <div style={{ flex: 1, overflow: "auto", padding: "24px", background: "#9ca3af", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 1050, boxShadow: "0 8px 40px rgba(0,0,0,0.35)", background: "#fff" }}>
          <VatTuPaper printRef={printRef} />
        </div>
      </div>
    </div>
  );
}

// ─── LẬP KẾ HOẠCH MODAL ──────────────────────────────────────────────────────
interface PlanModalProps {
  onClose: () => void;
  onSubmit: (plan: PlanEntry) => void;
}

function PlanModal({ onClose, onSubmit }: PlanModalProps) {
  const [step, setStep] = useState(1);
  const [dept, setDept] = useState("");
  const [planType, setPlanType] = useState<PlanType>("");
  const [period, setPeriod] = useState("Tháng 4/2026");
  const [target, setTarget] = useState<ReportTarget>("both");
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [uploadedFile, setUploadedFile] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const deptOptions = [
    { value: "", label: "-- Chọn phòng ban --" },
    { value: "PX Than Nguyên Khai", label: "PX Than Nguyên Khai" },
    { value: "PX Than Sạch", label: "PX Than Sạch" },
    { value: "PX Cơ điện", label: "PX Cơ điện" },
    { value: "Phòng Kế hoạch - Vật tư", label: "Phòng Kế hoạch - Vật tư" },
  ];

  const planCards = [
    { type: "ke-hoach-san-xuat" as PlanType, icon: "📊", label: "Kế hoạch sản xuất", sub: "Than, mét lò, CBSX..." },
    { type: "ke-hoach-nhan-su" as PlanType, icon: "👷", label: "Kế hoạch nhân sự", sub: "Lao động, ca làm việc..." },
    { type: "ke-hoach-vat-tu" as PlanType, icon: "📦", label: "Kế hoạch vật tư", sub: "Nhập - xuất - tồn kho..." },
    { type: "ke-hoach-tai-chinh" as PlanType, icon: "💰", label: "Kế hoạch tài chính", sub: "Chi phí, doanh thu..." },
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

  const inp: React.CSSProperties = { width: "100%", border: "1px solid #d1d5db", borderRadius: 6, padding: "7px 10px", fontSize: 12, fontFamily: "inherit", outline: "none" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 40, minHeight: 400 }}>
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
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>Phòng ban *</label>
                <select value={dept} onChange={(e) => setDept(e.target.value)} style={inp}>
                  {deptOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>Loại kế hoạch *</label>
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
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>Kỳ kế hoạch</label>
                  <select value={period} onChange={(e) => setPeriod(e.target.value)} style={inp}>
                    <option>Tháng 4/2026</option>
                    <option>Quý II/2026</option>
                    <option>Năm 2026</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#374151", display: "block", marginBottom: 5 }}>Gắn vào báo cáo</label>
                  <select value={target} onChange={(e) => setTarget(e.target.value as ReportTarget)} style={inp}>
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
                {(["upload", "form"] as InputMode[]).map((m) => (
                  <button key={m} onClick={() => setInputMode(m)} style={{
                    background: inputMode === m ? "#1d4ed8" : "#f3f4f6",
                    color: inputMode === m ? "#fff" : "#374151",
                    border: inputMode === m ? "none" : "1px solid #d1d5db",
                    borderRadius: 7, padding: "6px 14px", fontSize: 11, cursor: "pointer", fontFamily: "inherit",
                  }}>
                    {m === "upload" ? "Tải lên Excel" : "Nhập tay"}
                  </button>
                ))}
              </div>

              {inputMode === "upload" && (
                <>
                  <div
                    onClick={() => setUploadedFile("KH_" + (PLAN_TYPE_MAP[planType] || "").replace(/\s/g, "_") + "_" + period.replace(/\//g, "_") + ".xlsx")}
                    style={{ border: "2px dashed #93c5fd", borderRadius: 8, padding: 24, textAlign: "center", background: "#eff6ff", cursor: "pointer" }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>Kéo thả hoặc bấm để tải file Excel</div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 4 }}>Hỗ trợ .xlsx, .xls — tối đa 10MB</div>
                    {uploadedFile && <div style={{ marginTop: 8, fontSize: 11, color: "#059669", fontWeight: 700 }}>✓ Đã chọn: {uploadedFile}</div>}
                  </div>
                  <div style={{ marginTop: 10, padding: "8px 10px", background: "#f0f9ff", borderRadius: 6, fontSize: 10, color: "#0369a1" }}>
                    Tải mẫu Excel: <span style={{ textDecoration: "underline", cursor: "pointer", color: "#1d4ed8" }} onClick={() => alert("Đang tải mẫu...")}>Mẫu {PLAN_TYPE_MAP[planType]}.xlsx</span>
                  </div>
                </>
              )}

              {inputMode === "form" && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", marginBottom: 8 }}>Nhập chỉ tiêu kế hoạch</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {["Chỉ tiêu", "ĐVT", "Kế hoạch tháng", "Kế hoạch năm"].map((h) => (
                          <th key={h} style={{ padding: "5px 7px", border: "1px solid #9ca3af", fontSize: 10, fontWeight: 700, background: "#374151", color: "#fff", textAlign: "center" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {["Than nguyên khai", "Mét lò đào mới", "XDCB", "CBSX"].map((row, i) => (
                        <tr key={i}>
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
              {!submitted && (
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
                        <td style={{ border: "none", fontSize: 11, color: "#374151", padding: "4px 0", width: 140 }}>{label}</td>
                        <td style={{ border: "none", fontSize: 11, fontWeight: 700 }}>{value}</td>
                      </tr>
                    ))}
                  </table>
                </div>
              )}

              {submitting && (
                <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: 7, padding: 16, textAlign: "center", fontSize: 12, color: "#1d4ed8" }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>⟳</div>
                  Đang tạo kế hoạch và gắn vào báo cáo...
                </div>
              )}

              {submitted && (
                <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 7, padding: 16, fontSize: 12, color: "#065f46" }}>
                  <div style={{ fontSize: 16, marginBottom: 6 }}>✓ Tạo kế hoạch thành công!</div>
                  <b>{PLAN_TYPE_MAP[planType]}</b> — {dept} — {period}<br />
                  Đã gắn vào: <b>{REPORT_TARGET_MAP[target]}</b>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 8 }}>
          {step > 1 && !submitted && (
            <button onClick={() => setStep((s) => s - 1)} style={{ background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: 7, padding: "8px 16px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
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
function PlanBadge({ plan }: { plan: PlanEntry }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderLeft: "3px solid #1d4ed8", borderRadius: 7, padding: "5px 8px", marginBottom: 5, display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#1e3a5f" }}>{plan.type}</div>
        <div style={{ fontSize: 9, color: "#64748b" }}>{plan.dept} — {plan.period}</div>
      </div>
      <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8" }}>Đã gắn</span>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function CoalMiningDashboard() {
  const [timeFilter, setTimeFilter] = useState("Ngày");
  const [deptFilter, setDeptFilter] = useState("Tất cả");
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [plans, setPlans] = useState<PlanEntry[]>([]);
  const [etlStatus, setEtlStatus] = useState<EtlStatus>("idle");
  const [syncLog, setSyncLog] = useState(MOCK.syncLog);
  const [syncing, setSyncing] = useState(false);

  const handlePlanSubmit = (plan: PlanEntry) => {
    setPlans((prev) => [...prev, plan]);
  };

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

  const TH = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: "5px 7px", border: "1px solid #9ca3af", fontSize: 10,
    fontWeight: 700, background: "#1e3a5f", color: "#fff", textAlign: "center", ...extra,
  });
  const TD = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: "6px 7px", border: "1px solid #d1d5db", fontSize: 11, ...extra,
  });

  const pipeColor: Record<EtlStatus, string> = { idle: "#9ca3af", running: "#2563eb", done: "#059669", error: "#dc2626" };
  const pipeLabel: Record<EtlStatus, string> = { idle: "Chờ", running: "Đang chạy...", done: "Hoàn thành", error: "Lỗi" };

  const pipelines = [
    { icon: "⛏", label: "ETL — PX Than Nguyên Khai", sub: "DB Nguồn → Staging" },
    { icon: "🔩", label: "ETL — PX Than Sạch", sub: "DB Nguồn → Staging" },
    { icon: "📊", label: "Tổng hợp → Báo cáo TKV", sub: "Staging → Báo cáo nội bộ + TKV" },
  ];

  const noidungPlans = plans.filter((p) => p.target === "both" || p.target === "noidung");
  const tkvPlans = plans.filter((p) => p.target === "both" || p.target === "tkv");

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#f1f5f9;font-family:'Segoe UI',system-ui,sans-serif;color:#1f2937;font-size:13px;}
        .fbtn{background:#e2e8f0;border:none;padding:5px 11px;border-radius:5px;cursor:pointer;font-size:11px;font-family:inherit;color:#374151;font-weight:500;transition:all .12s;}
        .fbtn.on{background:#1e3a5f;color:#fff;}
        .fbtn:hover:not(.on){background:#cbd5e1;}
        tr:hover>td{background:#eff6ff!important;}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>

      <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>

        {/* ─── HEADER ─── */}
        <div style={{ background: "#fff", borderBottom: "3px solid #1e3a5f", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ width: 52, height: 52, background: "#1e3a5f", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#93c5fd", fontSize: 9, textAlign: "center", fontWeight: 700 }}>
            <div><div style={{ fontSize: 20 }}>⛏</div>CÔNG TY<br />ĐÈO NAI</div>
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: "#1e3a5f" }}>BÁO CÁO ĐIỀU HÀNH SẢN XUẤT & NHÂN SỰ</h1>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>Công ty Cổ phần Than Đèo Nai Cọc Sáu — Hôm nay: {todayStr}</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, marginBottom: 4, textAlign: "center" }}>Thời Gian</div>
              <div style={{ display: "flex", gap: 4 }}>
                {["Ngày", "Tuần", "Tháng"].map((f) => (
                  <button key={f} className={`fbtn${timeFilter === f ? " on" : ""}`} onClick={() => setTimeFilter(f)}>{f}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, marginBottom: 4, textAlign: "center" }}>Phòng ban</div>
              <div style={{ display: "flex", gap: 4 }}>
                {["Tất cả", "PX Than NK", "PX Than Sạch"].map((d) => (
                  <button key={d} className={`fbtn${deptFilter === d ? " on" : ""}`} onClick={() => setDeptFilter(d)}>{d}</button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#94a3b8", fontWeight: 700, marginBottom: 4, textAlign: "center" }}>Kế hoạch</div>
              <button
                onClick={() => setShowPlanModal(true)}
                style={{ background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 5, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
              >
                + Lập kế hoạch
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 10 }}>

          {/* ─── ROW 1: KPI ─── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>

            {/* Than NK */}
            <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
              <div style={{ background: "#1e3a5f", color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 700, textAlign: "center" }}>TỔNG THAN NGUYÊN KHAI LŨY KẾ (TẤN)</div>
              <div style={{ padding: 14, display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 34, fontWeight: 800, color: "#0f172a", fontFamily: "monospace", lineHeight: 1 }}>{MOCK.coalMTD.toLocaleString("vi-VN")}</div>
                  <div style={{ fontSize: 11, marginTop: 5, color: "#64748b" }}>Hôm nay <b style={{ color: "#2563eb" }}>{MOCK.coalToday.toLocaleString("vi-VN")} tấn</b></div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 2 }}>Kế hoạch: 30.000 tấn</div>
                    <div style={{ height: 6, background: "#e2e8f0", borderRadius: 4 }}>
                      <div style={{ height: "100%", width: "96.6%", background: "#2563eb", borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 9, color: "#2563eb", fontWeight: 700, marginTop: 2 }}>Đạt 96,6% <span style={{ color: "#059669" }}>▲ 5,2% so với cùng kỳ</span></div>
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <Sparkline data={MOCK.coal7Days} color="#2563eb" />
                  <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>7 ngày qua</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#f59e0b", fontFamily: "monospace", marginTop: 6 }}>{MOCK.coalQuality}%</div>
                  <div style={{ fontSize: 9, color: "#94a3b8" }}>Chất lượng (Ak)</div>
                </div>
              </div>
            </div>

            {/* Mét đào */}
            <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
              <div style={{ background: "#1e3a5f", color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 700, textAlign: "center" }}>MÉT ĐÀO LÒ MỚI LŨY KẾ (MÉT)</div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 34, fontWeight: 800, color: "#0f172a", fontFamily: "monospace", lineHeight: 1 }}>{MOCK.tunnelMTD}</div>
                <div style={{ fontSize: 11, marginTop: 5, color: "#64748b" }}>Hôm nay <b style={{ color: "#1e3a5f" }}>{MOCK.tunnelToday} m</b></div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 2 }}>Kế hoạch: 600 m</div>
                  <div style={{ height: 6, background: "#e2e8f0", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: "96.9%", background: "#1a56db", borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 9, color: "#1d4ed8", fontWeight: 700, marginTop: 2 }}>Đạt 96,9%</div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8" }}>PX Khai thác 1: 120m</span>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 700, background: "#fffbeb", color: "#d97706" }}>PX Khai thác 2: 80m</span>
                </div>
              </div>
            </div>

            {/* Nhân lực */}
            <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
              <div style={{ background: "#1e3a5f", color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 700, textAlign: "center" }}>TỔNG NHÂN LỰC</div>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 34, fontWeight: 800, color: "#0f172a", fontFamily: "monospace", lineHeight: 1 }}>{MOCK.workforce.total.toLocaleString("vi-VN")}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ background: "#1e3a5f", color: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 16, fontWeight: 800, fontFamily: "monospace" }}>{MOCK.workforce.diLam}</div>
                  {[["#1a56db", "#eff6ff", `Thợ lò: ${MOCK.workforce.diLamBreakdown.thoLo}`], ["#f59e0b", "#fffbeb", `Điện cơ: ${MOCK.workforce.diLamBreakdown.dienCo}`], ["#10b981", "#ecfdf5", `BCH: ${MOCK.workforce.diLamBreakdown.bch}`]].map(([c, bg, label]) => (
                    <span key={label} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, fontWeight: 700, color: c, background: bg, border: `1px solid ${c}44` }}>{label}</span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 700, background: "#fef2f2", color: "#dc2626" }}>Vắng: {MOCK.workforce.vang}</span>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 700, background: "#f3f4f6", color: "#6b7280" }}>Nghỉ: {MOCK.workforce.nghi}</span>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 4, fontWeight: 700, background: "#f3f4f6", color: "#6b7280" }}>Lũy kế: {MOCK.workforce.nghiLuyKe}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── ROW 2: WORKER + PRODUCTION ─── */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 10 }}>

            {/* Worker table */}
            <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
              <div style={{ background: "#1e3a5f", color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 700, textAlign: "center" }}>BẢNG CÔNG NHÂN LỰC CHI TIẾT</div>
              <div style={{ overflowX: "auto", padding: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th rowSpan={2} style={TH({ minWidth: 90 })}>Nhân lực</th>
                      <th rowSpan={2} style={TH({ width: 30 })}>Ô</th>
                      <th rowSpan={2} style={TH({ width: 30 })}>F</th>
                      <th rowSpan={2} style={TH({ width: 30 })}>TT</th>
                      <th colSpan={4} style={TH({ background: "#d97706" })}>Đi làm</th>
                      <th rowSpan={2} style={TH({ background: "#dc2626", minWidth: 60 })}>T.Lò vắng</th>
                      <th rowSpan={2} style={TH({ background: "#dc2626", minWidth: 60 })}>C.Điện vắng</th>
                    </tr>
                    <tr>
                      {["T.Lò", "Điện", "Cơ", "BCH"].map((h) => (
                        <th key={h} style={TH({ background: "#b45309", fontSize: 10 })}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK.workerTable.map((row, i) => {
                      const rowBg = row.highlight ? "#fef9c3" : row.blue ? "#eff6ff" : row.green ? "#f0fdf4" : i % 2 === 0 ? "#f9fafb" : "#fff";
                      const nameColor = row.blue ? "#1d4ed8" : row.green ? "#059669" : "#1f2937";
                      const hl: React.CSSProperties = { background: "#fef3c7" };
                      return (
                        <tr key={i}>
                          <td style={TD({ fontWeight: 700, color: nameColor, background: rowBg })}>{row.nhanluc}</td>
                          <td style={TD({ textAlign: "center", background: rowBg })}>{row.o}</td>
                          <td style={TD({ textAlign: "center", background: rowBg, color: row.f === 0 && row.highlight ? "#dc2626" : undefined, fontWeight: row.f === 0 && row.highlight ? 800 : undefined })}>{row.f}</td>
                          <td style={TD({ textAlign: "center", background: rowBg })}>{row.tt}</td>
                          <td style={{ ...TD({ textAlign: "center" }), ...hl, fontWeight: 700 }}>{row.tLo}</td>
                          <td style={{ ...TD({ textAlign: "center" }), ...hl, fontWeight: 700 }}>{row.dien}</td>
                          <td style={{ ...TD({ textAlign: "center" }), ...hl, fontWeight: 700 }}>{row.co}</td>
                          <td style={{ ...TD({ textAlign: "center" }), ...hl, fontWeight: 700 }}>{row.bch}</td>
                          <td style={{ ...TD({ textAlign: "center", background: rowBg }), color: row.tLoVang ? "#dc2626" : "#1f2937", fontWeight: row.tLoVang ? 800 : 400 }}>{row.tLoVang}</td>
                          <td style={{ ...TD({ textAlign: "center", background: rowBg }), color: row.cdienVang === 0 ? "#059669" : "#1f2937", fontWeight: row.cdienVang === 0 ? 700 : 400 }}>{row.cdienVang === 0 ? "0" : (row.cdienVang ?? "")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Production */}
            <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
              <div style={{ background: "#1e3a5f", color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 700, textAlign: "center" }}>KẾT QUẢ SẢN XUẤT HÔM NAY VS LŨY KẾ</div>
              <div style={{ padding: 10 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>{["Chỉ tiêu", "ĐV", "Hôm nay", "Lũy kế tháng"].map((h) => <th key={h} style={TH({ fontSize: 10, padding: "5px 7px" })}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {MOCK.productionTable.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                        <td style={TD({ fontWeight: 500, fontSize: 11 })}>{row.chiTieu}</td>
                        <td style={TD({ textAlign: "center", color: "#6b7280", fontSize: 11 })}>{row.dvj}</td>
                        <td style={TD({ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#1e3a5f" })}>{typeof row.homNay === "number" ? row.homNay.toLocaleString("vi-VN") : row.homNay}</td>
                        <td style={TD({ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#1a56db" })}>{typeof row.luyKe === "number" ? row.luyKe.toLocaleString("vi-VN") : row.luyKe}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ─── ROW 3: BÁO CÁO NỘI BỘ + TKV ─── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>

            {/* A. Báo cáo nội bộ */}
            <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
              <div style={{ background: "#065f46", color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 700, textAlign: "center" }}>A. BÁO CÁO NỘI BỘ — TỪ CÁC PHÂN XƯỞNG</div>
              <div style={{ padding: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>Phân xưởng:</span>
                  <select style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 8px", fontSize: 11 }}>
                    <option>Tất cả phân xưởng</option>
                    <option>PX Than Nguyên Khai</option>
                    <option>PX Than Sạch</option>
                  </select>
                </div>

                {/* PX Than NK */}
                <div style={{ border: "1px solid #e5e7eb", borderLeft: "3px solid #1d4ed8", borderRadius: 7, padding: "8px 10px", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, background: "#eff6ff", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⛏</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "#1e3a5f" }}>PX Than Nguyên Khai</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Đồng bộ lần cuối: <b>Ngày 5/04</b> lúc 08:30</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, fontWeight: 700, background: "#ecfdf5", color: "#059669" }}>Đã đồng bộ</span>
                      <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8" }}>6.917 tấn</span>
                    </div>
                  </div>
                  <button className="fbtn" style={{ fontSize: 10 }}>Xem</button>
                </div>

                {/* PX Than Sạch */}
                <div style={{ border: "1px solid #e5e7eb", borderLeft: "3px solid #059669", borderRadius: 7, padding: "8px 10px", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, background: "#ecfdf5", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🔩</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 12, color: "#065f46" }}>PX Than Sạch</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>Đồng bộ lần cuối: <b>Ngày 5/04</b> lúc 09:15</div>
                    <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, fontWeight: 700, background: "#ecfdf5", color: "#059669" }}>Đã đồng bộ</span>
                      <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, fontWeight: 700, background: "#eff6ff", color: "#1d4ed8" }}>4.120 tấn</span>
                      <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, fontWeight: 700, background: "#fef2f2", color: "#dc2626" }}>Chờ xác nhận</span>
                    </div>
                  </div>
                  <button className="fbtn" style={{ fontSize: 10 }}>Xem</button>
                </div>

                {/* Kế hoạch nội bộ */}
                <div style={{ padding: "8px 10px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 7, marginTop: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#0369a1", marginBottom: 6 }}>KẾ HOẠCH ĐÃ GẮN</div>
                  {noidungPlans.length === 0
                    ? <div style={{ fontSize: 10, color: "#64748b", fontStyle: "italic" }}>Chưa có kế hoạch. Nhấn "+ Lập kế hoạch" để tạo.</div>
                    : noidungPlans.map((p, i) => <PlanBadge key={i} plan={p} />)
                  }
                </div>
              </div>
            </div>

            {/* B. Báo cáo TKV */}
            <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
              <div style={{ background: "#92400e", color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 700, textAlign: "center" }}>B. BÁO CÁO TKV — TỔNG HỢP GỬI TẬP ĐOÀN</div>
              <div style={{ padding: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>Loại báo cáo:</span>
                  <select style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 8px", fontSize: 11 }}>
                    <option>Báo cáo sản lượng (Mẫu TKV)</option>
                    <option>Báo cáo lao động (Mẫu TKV)</option>
                    <option>Báo cáo tổng hợp (Mẫu TKV)</option>
                  </select>
                </div>

                {/* TKV tổng hợp ngày 5 — 2 PX */}
                <div style={{ border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px", background: "#f0fdf4", marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#065f46", marginBottom: 8 }}>
                    Báo cáo Than — Ngày 5/04/2026
                    <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 3, fontWeight: 700, background: "#dcfce7", color: "#15803d", marginLeft: 8 }}>Đủ dữ liệu</span>
                  </div>
                  {[
                    { dept: "PX Than Nguyên Khai", value: "6.917 tấn", ok: true },
                    { dept: "PX Than Sạch", value: "4.120 tấn", ok: true },
                  ].map((row, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, background: "#fff", borderRadius: 5, padding: "5px 8px", marginBottom: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: row.ok ? "#10b981" : "#f59e0b", flexShrink: 0 }} />
                      <span style={{ flex: 1, color: "#374151" }}>{row.dept} — Ngày 5/04</span>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1d4ed8" }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", background: "#d1fae5", borderRadius: 5, fontWeight: 700, fontSize: 11, marginTop: 4 }}>
                    <span style={{ color: "#065f46" }}>Tổng hợp TKV — Ngày 5</span>
                    <span style={{ fontFamily: "monospace", color: "#1e3a5f" }}>11.037 tấn</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <button onClick={() => setShowPdfModal(true)} style={{ background: "#059669", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Xuất Excel TKV</button>
                    <button className="fbtn" style={{ fontSize: 11 }}>Xem trước</button>
                  </div>
                </div>

                {/* Chờ PX Than Sạch ngày 6 */}
                <div style={{ border: "1px solid #fde68a", borderRadius: 7, padding: "8px 10px", background: "#fffbeb", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#92400e", marginBottom: 5 }}>CÒN CHỜ DỮ LIỆU</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#f59e0b" }} />
                    <span style={{ flex: 1 }}>PX Than Sạch — Ngày 6/04</span>
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
            </div>
          </div>

          {/* ─── ROW 4: ETL ─── */}
          <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.07)" }}>
            <div style={{ background: "#374151", color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 700, textAlign: "center" }}>ĐỒNG BỘ DỮ LIỆU TỪ CÁC PHÂN XƯỞNG → BÁO CÁO TKV</div>
            <div style={{ padding: "12px 14px", display: "grid", gridTemplateColumns: "260px 1fr 1fr", gap: 14 }}>

              {/* DB Config */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1e3a5f", marginBottom: 8 }}>Kết nối nguồn dữ liệu</div>
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
                  style={{ width: "100%", background: syncing ? "#6b7280" : "#1e3a5f", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 800, cursor: syncing ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                >
                  {syncing ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Đang đồng bộ...</> : "⬇ Đồng bộ tất cả"}
                </button>
                <div style={{ marginTop: 6, padding: "6px 10px", borderRadius: 6, background: etlStatus === "done" ? "#ecfdf5" : etlStatus === "running" ? "#eff6ff" : "#f3f4f6", fontSize: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: etlStatus === "done" ? "#10b981" : etlStatus === "running" ? "#3b82f6" : "#9ca3af" }} />
                  <span style={{ color: etlStatus === "done" ? "#059669" : etlStatus === "running" ? "#1d4ed8" : "#6b7280", fontWeight: 700 }}>
                    {etlStatus === "done" ? "Đồng bộ hoàn thành" : etlStatus === "running" ? "Đang đồng bộ..." : "Chờ đồng bộ"}
                  </span>
                </div>
              </div>

              {/* Pipeline */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1e3a5f", marginBottom: 8 }}>ETL Pipeline Flow</div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  {pipelines.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#fff", borderRadius: 8, border: `1px solid ${pipeColor[etlStatus]}33` }}>
                      <div style={{ width: 32, height: 32, borderRadius: 6, background: pipeColor[etlStatus] + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>{p.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 700 }}>{p.label}</div>
                        <div style={{ fontSize: 9, color: "#64748b" }}>{p.sub}</div>
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: pipeColor[etlStatus] }} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Log */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1e3a5f", marginBottom: 8 }}>Nhật ký đồng bộ</div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "85px 1fr 50px", padding: "5px 10px", background: "#1e3a5f" }}>
                    {["Thời gian", "Nội dung", "Trạng thái"].map((h) => <span key={h} style={{ fontSize: 9, color: "#fff", fontWeight: 700 }}>{h}</span>)}
                  </div>
                  <div style={{ maxHeight: 150, overflowY: "auto" }}>
                    {syncLog.map((row, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "85px 1fr 50px", padding: "5px 10px", background: i % 2 === 0 ? "#fff" : "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                        <span style={{ fontSize: 9, color: "#6b7280", fontFamily: "monospace" }}>{row.ts}</span>
                        <span style={{ fontSize: 9 }}>{row.noidung}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: row.ok ? "#059669" : "#d97706" }}>{row.ok ? "OK" : "Warn"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", paddingBottom: 8 }}>
            <span>Dữ liệu cập nhật đến: 28/04/2026 10:30</span>
            <span>Nguồn: Hệ thống sản xuất</span>
            <span>Người cập nhật: Nguyễn Văn A</span>
            <span>Phiên bản: 2.1.0</span>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showPlanModal && <PlanModal onClose={() => setShowPlanModal(false)} onSubmit={handlePlanSubmit} />}
      {showPdfModal && <SyncPdfModal onClose={() => setShowPdfModal(false)} />}
    </>
  );
}