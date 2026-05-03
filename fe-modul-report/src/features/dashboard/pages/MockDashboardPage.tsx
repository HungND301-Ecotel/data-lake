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

interface WorkerRow {
  nhanluc: string;
  o: number | string;
  f: number | string;
  tt: number | string;
  h: number | string;
  v: number | string;
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
  coalMTD: 28981, coalToday: 1200, coalQuality: 8.5,
  coal7Days: [900, 1050, 1100, 980, 1150, 1080, 1200],
  tunnelMTD: 581.1, tunnelToday: 10.0,
  tunnelBreakdown: [
    { label: "Mét Đào", px1: 120, px2: 80 },
    { label: "Khai thác 1", px1: 95, px2: 60 },
    { label: "Khai thác 2", px1: 70, px2: 45 },
  ],
  workforce: {
    total: 1450, diLam: 29,
    diLamBreakdown: { thoLo: 15, dienCo: 7, bch: 3 },
    vang: 5, nghi: 1, nghiLuyKe: 16, absent: 20,
  },
  workerTable: [
    { nhanluc: "Phó QD trực ca", o: 1, f: 0, tt: 0, h: 0, v: 0, tLo: 29, dien: 15, co: 7, bch: 3, tLoVang: 3, cdienVang: 0, highlight: true },
    { nhanluc: "Thợ lò", o: 32, f: 1, tt: "", h: "", v: "", tLo: 29, dien: "", co: "", bch: "", tLoVang: 3, cdienVang: "", blue: true },
    { nhanluc: "Cơ điện", o: 15, f: "", tt: "", h: "", v: "", tLo: "", dien: 15, co: "", bch: "", tLoVang: "", cdienVang: 0, green: true },
    { nhanluc: "BCH, PVụ", o: "", f: "F:1", tt: "", h: "", v: "", tLo: "", dien: "", co: "", bch: "", tLoVang: "", cdienVang: "" },
    { nhanluc: "8", o: "", f: "", tt: "", h: "", v: "", tLo: "", dien: "", co: 7, bch: "", tLoVang: "", cdienVang: "" },
    { nhanluc: "HS", o: "", f: "", tt: "", h: "", v: "", tLo: "", dien: "", co: "", bch: "", tLoVang: "", cdienVang: "" },
  ] as WorkerRow[],
  productionTable: [
    { chiTieu: "Than NK sản xuất", dvj: "Tấn", homNay: 6917, luyKe: 28981 },
    { chiTieu: "Mét lò đào mới (m)", dvj: "m", homNay: 3140, luyKe: 581.1 },
    { chiTieu: "XDCB (m)", dvj: "m", homNay: 310, luyKe: 71.4 },
    { chiTieu: "CBSX (m)", dvj: "m", homNay: 2520, luyKe: 452.9 },
    { chiTieu: "Mò xén (m)", dvj: "m", homNay: 105, luyKe: 56.8 },
    { chiTieu: "Mét lò xén (m)", dvj: "xd", homNay: 11, luyKe: 57.9 },
  ],
  logisticsTable: [
    { chiTieu: "Tiêu thụ kho vận", dvj: "Tấn", thang: 4.75 },
    { chiTieu: "Giao than Vàng Danh", dvj: "Tấn", thang: 1.53 },
  ],
  etlLog: [
    { ts: "10/04/2026 14:32:10", hogKy: "Dữ liệu sản xuất Q1", log: "OK" },
    { ts: "10/04/2026 14:31:58", hogKy: "Nhân sự ca sáng", log: "OK" },
    { ts: "09/04/2026 17:06:53", hogKy: "Tồn kho vật tư", log: "OK" },
    { ts: "09/04/2026 16:45:12", hogKy: "Logistics giao than", log: "Warn" },
    { ts: "08/04/2026 11:20:00", hogKy: "ERP sync", log: "Err" },
  ],
  syncedData: [
    { stt: 1, ngay: "10/04/2026", ca: "Ca 1", thoLo: 29, dienCo: 15, bch: 3, thanNK: 1200, metDao: 10.0, xdcb: 12, cbsx: 85, trangThai: "Chờ đẩy" },
    { stt: 2, ngay: "09/04/2026", ca: "Cả ngày", thoLo: 258, dienCo: 78, bch: 42, thanNK: 6917, metDao: 38.5, xdcb: 310, cbsx: 2520, trangThai: "Đã đẩy" },
    { stt: 3, ngay: "08/04/2026", ca: "Cả ngày", thoLo: 255, dienCo: 76, bch: 41, thanNK: 6540, metDao: 36.2, xdcb: 298, cbsx: 2410, trangThai: "Đã đẩy" },
    { stt: 4, ngay: "07/04/2026", ca: "Cả ngày", thoLo: 260, dienCo: 80, bch: 43, thanNK: 7100, metDao: 40.1, xdcb: 320, cbsx: 2600, trangThai: "Chờ đẩy" },
    { stt: 5, ngay: "06/04/2026", ca: "Cả ngày", thoLo: 252, dienCo: 74, bch: 40, thanNK: 6200, metDao: 34.8, xdcb: 285, cbsx: 2300, trangThai: "Đã đẩy" },
  ],
};

// ─── VẬT TƯ DATA ─────────────────────────────────────────────────────────────
const VATTU_DATA: { ky: number; nam: number; groups: VatTuGroup[] } = {
  ky: 1, nam: 2026,
  groups: [
    {
      code: "A", maChiTieu: "VL", tenNhom: "Vật liệu",
      items: [
        { stt: 1, maChiTieu: "5000000000001", ten: "Thuốc nổ và VLNCN", tonDauKy: 476838.21, nhapTuMua: 8418041.25, nhapKhac: 0, xuatSX: 8502048.73, xuatKhac: 0, tonCuoiKy: null },
        { stt: 2, maChiTieu: "5000000000002", ten: "Gỗ lò, gỗ các loại", tonDauKy: 478464.84, nhapTuMua: 3782310, nhapKhac: 155600, xuatSX: 3975936.79, xuatKhac: 375411.74, tonCuoiKy: null },
        { stt: 3, maChiTieu: "5000000000003", ten: "Thép lò, vì lò, phụ kiện vì chống lò", tonDauKy: 3151728.98, nhapTuMua: 25192141.75, nhapKhac: 4357294.73, xuatSX: 28103647.24, xuatKhac: 3666878.97, tonCuoiKy: null },
        { stt: 4, maChiTieu: "5000000000004", ten: "Sắt thép các loại khác", tonDauKy: 2041922.88, nhapTuMua: 2185379.82, nhapKhac: 0, xuatSX: 490205.53, xuatKhac: 2874596.75, tonCuoiKy: null },
        { stt: 5, maChiTieu: "5000000000005", ten: "Cột, xà thủy lực, xà hộp, xà khớp, xà ma sát", tonDauKy: 1246031.79, nhapTuMua: 56544, nhapKhac: 503038.93, xuatSX: 654592.55, xuatKhac: 63567.03, tonCuoiKy: null },
        { stt: 6, maChiTieu: "5000000000006", ten: "Mũi khoan, choòng khoan các loại (hầm lò)", tonDauKy: 63491, nhapTuMua: 561306, nhapKhac: 0, xuatSX: 469577, xuatKhac: 0, tonCuoiKy: null },
        { stt: 7, maChiTieu: "5000000000007", ten: "Lưới lót nóc lò", tonDauKy: 632907.54, nhapTuMua: 2878938, nhapKhac: 0, xuatSX: 3447977.04, xuatKhac: 0, tonCuoiKy: null },
        { stt: 8, maChiTieu: "5000000000008", ten: "Cầu, xích máng cào", tonDauKy: 43126.49, nhapTuMua: 1096860, nhapKhac: 84963.83, xuatSX: 816516.72, xuatKhac: 0, tonCuoiKy: null },
        { stt: 9, maChiTieu: "5000000000009", ten: "Đèn lò", tonDauKy: null, nhapTuMua: null, nhapKhac: null, xuatSX: null, xuatKhac: null, tonCuoiKy: null },
        { stt: 10, maChiTieu: "5000000000010", ten: "Mũi khoan, ty khoan lộ thiên", tonDauKy: null, nhapTuMua: null, nhapKhac: null, xuatSX: null, xuatKhac: null, tonCuoiKy: null },
        { stt: 11, maChiTieu: "5000000000011", ten: "Răng gầu máy xúc", tonDauKy: null, nhapTuMua: null, nhapKhac: null, xuatSX: null, xuatKhac: null, tonCuoiKy: null },
        { stt: 12, maChiTieu: "5000000000012", ten: "Cáp thép các loại", tonDauKy: 0, nhapTuMua: 416500, nhapKhac: 0, xuatSX: 303930, xuatKhac: 0, tonCuoiKy: null },
        { stt: 13, maChiTieu: "5000000000013", ten: "Cáp điện các loại", tonDauKy: 57113.6, nhapTuMua: 1059225, nhapKhac: 0, xuatSX: 376428.6, xuatKhac: 0, tonCuoiKy: null },
        { stt: 14, maChiTieu: "5000000000014", ten: "Bình ắc quy các loại", tonDauKy: null, nhapTuMua: null, nhapKhac: null, xuatSX: null, xuatKhac: null, tonCuoiKy: null },
        { stt: 15, maChiTieu: "5000000000015", ten: "Lốp ô tô các loại", tonDauKy: null, nhapTuMua: null, nhapKhac: null, xuatSX: null, xuatKhac: null, tonCuoiKy: null },
        { stt: 16, maChiTieu: "5000000000016", ten: "Băng tải cao su", tonDauKy: 0, nhapTuMua: 640000, nhapKhac: 0, xuatSX: 512000, xuatKhac: 0, tonCuoiKy: null },
        { stt: 17, maChiTieu: "5000000000017", ten: "Con lăn băng tải", tonDauKy: 93820, nhapTuMua: 0, nhapKhac: 0, xuatSX: 76820, xuatKhac: 0, tonCuoiKy: null },
        { stt: 18, maChiTieu: "5000000000018", ten: "Phụ tùng SCTX", tonDauKy: 5480087.75, nhapTuMua: 17324953, nhapKhac: 194098.9, xuatSX: 8833380.38, xuatKhac: 1994979.35, tonCuoiKy: null },
        { stt: 19, maChiTieu: "5000000000019", ten: "Hóa chất các loại", tonDauKy: 310119.26, nhapTuMua: 855740, nhapKhac: 0, xuatSX: 862870.6, xuatKhac: 111093.66, tonCuoiKy: null },
        { stt: 20, maChiTieu: "5000000000020", ten: "Xút (NaOH)", tonDauKy: 8160, nhapTuMua: 34110, nhapKhac: 0, xuatSX: 42270, xuatKhac: 0, tonCuoiKy: null },
        { stt: 21, maChiTieu: "5000000000021", ten: "Chất trợ lắng", tonDauKy: 15431.6, nhapTuMua: 60030, nhapKhac: 0, xuatSX: 75461.6, xuatKhac: 0, tonCuoiKy: null },
        { stt: 22, maChiTieu: "5000000000022", ten: "Dầu mỡ phụ", tonDauKy: 1147737.65, nhapTuMua: 2749487.05, nhapKhac: 0, xuatSX: 2760818.28, xuatKhac: 45306.4, tonCuoiKy: null },
        { stt: 23, maChiTieu: "5000000000023", ten: "Vật tư thu hồi, phế liệu", tonDauKy: 11163900.18, nhapTuMua: 0, nhapKhac: 1852939.81, xuatSX: 1328216.39, xuatKhac: 1606768.37, tonCuoiKy: null },
        { stt: 24, maChiTieu: "5000000000037", ten: "Vật tư đi theo dự án", tonDauKy: null, nhapTuMua: null, nhapKhac: null, xuatSX: null, xuatKhac: null, tonCuoiKy: null },
        { stt: 25, maChiTieu: "5000000000038", ten: "Vật tư dự phòng cho SX theo chỉ đạo TKV", tonDauKy: null, nhapTuMua: null, nhapKhac: null, xuatSX: null, xuatKhac: null, tonCuoiKy: null },
        { stt: 26, maChiTieu: "5000000000024", ten: "Vật liệu khác", tonDauKy: 8184530.17, nhapTuMua: 21476940.5, nhapKhac: 4153866.26, xuatSX: 24222053.31, xuatKhac: 1737990.71, tonCuoiKy: null },
      ],
    },
    {
      code: "B", maChiTieu: "NL", tenNhom: "Nhiên liệu",
      items: [
        { stt: 1, maChiTieu: "5000000000025", ten: "Xăng, dầu", tonDauKy: 827758.85, nhapTuMua: 3688140.83, nhapKhac: null, xuatSX: 4471806.13, xuatKhac: 44093.55, tonCuoiKy: 0 },
        { stt: 2, maChiTieu: "5000000000026", ten: "Than", tonDauKy: null, nhapTuMua: null, nhapKhac: null, xuatSX: null, xuatKhac: null, tonCuoiKy: null },
        { stt: 3, maChiTieu: "5000000000027", ten: "Khác", tonDauKy: null, nhapTuMua: null, nhapKhac: null, xuatSX: null, xuatKhac: null, tonCuoiKy: null },
      ],
    },
  ],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtNum = (n: number | null | undefined): string =>
  n == null ? "" : new Intl.NumberFormat("vi-VN").format(Math.round(n));

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ data, color = "#1a56db" }: { data: number[]; color?: string }) {
  const w = 120, h = 38;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <defs>
        <linearGradient id="spg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0,${h} M${pts.join("L")}L${w},${h}Z`} fill="url(#spg)" />
      <path d={`M${pts.join("L")}`} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── GAUGE ────────────────────────────────────────────────────────────────────
function Gauge({ value, max = 100, color = "#f59e0b", size = 80 }: {
  value: number; max?: number; color?: string; size?: number;
}) {
  const r = 28, circ = Math.PI * r;
  const dash = Math.min(value / max, 1) * circ;
  return (
    <svg width={size} height={size * 0.6} viewBox="0 0 80 50">
      <path d="M12,38 A28,28 0 0,1 68,38" fill="none" stroke="#e5e7eb" strokeWidth="9" strokeLinecap="round" />
      <path d="M12,38 A28,28 0 0,1 68,38" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} />
      <text x="40" y="34" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f2937"
        fontFamily="monospace">{value}%</text>
    </svg>
  );
}

// ─── MINI BAR CHART ───────────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: Array<{ label: string; px1: number; px2: number }> }) {
  const max = 150;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 70 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
            <div style={{ width: 10, background: "#1a56db", height: (d.px1 / max) * 56, borderRadius: "2px 2px 0 0", minHeight: 2 }} />
            <div style={{ width: 10, background: "#f59e0b", height: (d.px2 / max) * 56, borderRadius: "2px 2px 0 0", minHeight: 2 }} />
          </div>
          <div style={{ fontSize: 8, color: "#6b7280", textAlign: "center", maxWidth: 44, lineHeight: 1.2 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── DONUT ────────────────────────────────────────────────────────────────────
function DonutSmall({ values, colors, size = 64 }: { values: number[]; colors: string[]; size?: number }) {
  const total = values.reduce((a, b) => a + b, 0);
  const circ = 2 * Math.PI * 22;
  let off = circ / 4;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60">
      {values.map((v, i) => {
        const dash = (v / total) * circ;
        const el = <circle key={i} cx="30" cy="30" r="22" fill="none" stroke={colors[i]} strokeWidth="10"
          strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={off} />;
        off -= dash;
        return el;
      })}
      <text x="30" y="35" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1f2937" fontFamily="monospace">{total}</text>
    </svg>
  );
}

// ─── PDF PAPER (Biểu mẫu 01/VT) ──────────────────────────────────────────────
function VatTuPaper({ printRef }: { printRef: React.RefObject<HTMLDivElement | null> }) {
  const S = {
    th: { border: "1px solid #000", padding: "3px 4px", fontSize: 8, fontWeight: 700, textAlign: "center" as const, verticalAlign: "middle" as const, lineHeight: 1.3, background: "#e8edf7" },
    thDark: { border: "1px solid #000", padding: "3px 4px", fontSize: 8, fontWeight: 700, textAlign: "center" as const, verticalAlign: "middle" as const, lineHeight: 1.3, background: "#c9d4e8" },
    td: { border: "1px solid #999", padding: "2px 4px", fontSize: 8, verticalAlign: "middle" as const },
    tdC: { border: "1px solid #999", padding: "2px 4px", fontSize: 8, verticalAlign: "middle" as const, textAlign: "center" as const },
    tdR: { border: "1px solid #999", padding: "2px 4px", fontSize: 8, verticalAlign: "middle" as const, textAlign: "right" as const },
    tdGroup: { border: "1px solid #888", padding: "3px 4px", fontSize: 8, fontWeight: 700, verticalAlign: "middle" as const, background: "#c9d4e8" },
    tdGroupR: { border: "1px solid #888", padding: "3px 4px", fontSize: 8, fontWeight: 700, verticalAlign: "middle" as const, background: "#c9d4e8", textAlign: "right" as const },
    tdTotal: { border: "1px solid #888", padding: "3px 4px", fontSize: 8, fontWeight: 700, verticalAlign: "middle" as const, background: "#e8edf7", textAlign: "right" as const },
  };

  const sumItems = (items: VatTuItem[], field: keyof VatTuItem) =>
    items.reduce((s, it) => s + ((it[field] as number) ?? 0), 0);

  const allItems = VATTU_DATA.groups.flatMap(g => g.items);
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
    <div ref={printRef} style={{ width: "100%", background: "#fff", padding: "28px 32px 36px", fontFamily: '"Times New Roman", Times, serif', color: "#000", fontSize: 10 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, letterSpacing: 0.3 }}>{COMPANY_NAME}</div>
          <div style={{ fontWeight: 700, fontSize: 11, marginTop: 1 }}>{COMPANY_DEPT}</div>
          <div style={{ borderBottom: "2.5px solid #000", width: 400, marginTop: 5 }} />
        </div>
        <div style={{ textAlign: "right", fontSize: 10 }}>
          <div style={{ fontWeight: 700 }}>{BIEU_MAU}</div>
          <div style={{ marginTop: 2 }}>Năm: <b>{VATTU_DATA.nam}</b> &nbsp; Kỳ: <b>Quý {VATTU_DATA.ky}</b></div>
          <div style={{ marginTop: 2, fontStyle: "italic", fontSize: 9 }}>ĐVT: Nghìn đồng</div>
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: "center", margin: "10px 0 8px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.6, textTransform: "uppercase" }}>
          Báo Cáo Tổng Hợp Luân Chuyển Vật Tư
        </div>
        <div style={{ fontWeight: 700, fontSize: 11, marginTop: 3 }}>
          (NHẬP - XUẤT - TỒN) — Quý {VATTU_DATA.ky} Năm {VATTU_DATA.nam}
        </div>
        <div style={{ fontSize: 9, color: "#444", marginTop: 2 }}>ĐVT: Nghìn đồng (VNĐ)</div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 900 }}>
          <thead>
            <tr>
              <th rowSpan={3} style={{ ...S.thDark, width: 25 }}>Số TT</th>
              <th rowSpan={3} style={{ ...S.thDark, width: 60 }}>Mã chỉ tiêu</th>
              <th rowSpan={3} style={{ ...S.thDark, minWidth: 160 }}>Tên vật tư / nhóm vật tư</th>
              <th rowSpan={3} style={{ ...S.thDark, width: 75 }}>Tồn đầu kỳ</th>
              <th colSpan={3} style={S.thDark}>Nhập trong kỳ</th>
              <th colSpan={3} style={S.thDark}>Xuất trong kỳ</th>
              <th rowSpan={3} style={{ ...S.thDark, width: 75 }}>Tồn cuối kỳ</th>
            </tr>
            <tr>
              <th style={{ ...S.th, width: 75 }}>Tổng nhập</th>
              <th style={{ ...S.th, width: 75 }}>Nhập từ nguồn mua</th>
              <th style={{ ...S.th, width: 75 }}>Nhập từ nguồn khác</th>
              <th style={{ ...S.th, width: 75 }}>Tổng xuất</th>
              <th style={{ ...S.th, width: 75 }}>Xuất cho sản xuất</th>
              <th style={{ ...S.th, width: 75 }}>Xuất khác</th>
            </tr>
          </thead>
          <tbody>
            {/* Grand total row */}
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
                <tr key={`g-${group.code}`} style={{ background: "#c9d4e8" }}>
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
                      <td style={{ ...S.tdC, fontSize: 7, color: "#1a3a7c" }}>{item.maChiTieu}</td>
                      <td style={{ ...S.td, fontSize: 8 }}>{item.ten}</td>
                      <td style={S.tdR}>{fmtNum(item.tonDauKy)}</td>
                      <td style={S.tdR}>{hasAny ? fmtNum(tongNhap) : ""}</td>
                      <td style={{ ...S.tdR, color: "#14532d" }}>{fmtNum(item.nhapTuMua)}</td>
                      <td style={S.tdR}>{fmtNum(item.nhapKhac)}</td>
                      <td style={S.tdR}>{hasAny ? fmtNum(tongXuat) : ""}</td>
                      <td style={{ ...S.tdR, color: "#7c2d12" }}>{fmtNum(item.xuatSX)}</td>
                      <td style={S.tdR}>{fmtNum(item.xuatKhac)}</td>
                      <td style={{ ...S.tdR, fontWeight: hasAny ? 600 : 400, color: hasAny ? "#1a3a7c" : "#aaa" }}>
                        {hasAny ? fmtNum(tonCuoi) : ""}
                      </td>
                    </tr>
                  );
                }),
              ];
            })}
          </tbody>
        </table>
      </div>

      {/* Note */}
      <div style={{ marginTop: 12, padding: "6px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 4, fontSize: 9, color: "#92400e" }}>
        ⚠ Dữ liệu đã được đồng bộ từ hệ thống. Vui lòng kiểm tra và xác nhận trước khi đẩy lên hệ thống tập đoàn.
      </div>

      {/* Signatures */}
      <div style={{ marginTop: 24 }}>
        <div style={{ textAlign: "right", fontStyle: "italic", fontSize: 10, marginBottom: 16 }}>
          Đèo Nai, ngày {todayDay} tháng {todayMonth} năm {todayYear}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", textAlign: "center", gap: 8 }}>
          {[
            { title: "NGƯỜI LẬP BIỂU", note: "(Ký, ghi rõ họ tên)" },
            { title: "TRƯỞNG PHÒNG KẾ HOẠCH", note: "(Ký, ghi rõ họ tên)" },
            { title: "GIÁM ĐỐC CÔNG TY", note: "(Ký, ghi rõ họ tên, đóng dấu)" },
          ].map((sig, i) => (
            <div key={i} style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 10 }}>{sig.title}</div>
              <div style={{ fontSize: 9, marginTop: 2, color: "#555" }}>{sig.note}</div>
              <div style={{ marginTop: 52, borderBottom: "1px solid #000", width: "60%", margin: "52px auto 0" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PDF MODAL (giống Reports.tsx) ───────────────────────────────────────────
function SyncPdfModal({ onClose }: { onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=1200,height=900");
    if (!win || !printRef.current) return;
    win.document.write(`
      <!DOCTYPE html><html><head>
        <meta charset="utf-8"/>
        <title>Báo cáo Luân chuyển Vật tư - Quý ${VATTU_DATA.ky}/${VATTU_DATA.nam}</title>
        <style>
          @page { size: A3 landscape; margin: 8mm; }
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; font-family: "Times New Roman", serif; }
        </style>
      </head><body>${printRef.current.outerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "10px 24px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1e3a5f" }}>
            Xem trước dữ liệu đồng bộ — Báo cáo Luân chuyển Vật tư
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1 }}>
            Quý {VATTU_DATA.ky} / {VATTU_DATA.nam} — {COMPANY_NAME}
          </div>
        </div>
        <button onClick={handlePrint} style={{
          background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 7,
          padding: "8px 18px", fontSize: 12, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          🖨 In / Lưu PDF
        </button>
        <button onClick={onClose} style={{
          background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db",
          borderRadius: 7, padding: "8px 16px", fontSize: 12, cursor: "pointer",
        }}>
          ✕ Đóng
        </button>
      </div>

      {/* Paper area — nền xám như Reports.tsx */}
      <div style={{ flex: 1, overflow: "auto", padding: "28px 32px", background: "#9ca3af", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 1100, boxShadow: "0 8px 40px rgba(0,0,0,0.35)", background: "#fff", borderRadius: 2 }}>
          <VatTuPaper printRef={printRef} />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function CoalMiningDashboard() {
  const [timeFilter, setTimeFilter] = useState("Ngày");
  const [workshop, setWorkshop] = useState("Tất cả");
  const [dbBaoCao, setDbBaoCao] = useState({ ip: "192.168.1.100", port: "1433", user: "", pass: "" });
  const [dbNhanSu, setDbNhanSu] = useState({ ip: "192.168.1.101", port: "1433", user: "", pass: "" });
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [etlStatus, setEtlStatus] = useState<EtlStatus>("idle");

  const handleSync = () => {
    setSyncing(true); setSyncDone(false); setEtlStatus("running");
    setTimeout(() => { setSyncing(false); setSyncDone(true); setEtlStatus("done"); }, 2500);
  };

  const WORKSHOPS = ["Tất cả", "PX Khai thác 1", "PX Khai thác 2"];
  const TIME_FILTERS = ["Ngày", "Tuần", "Tháng"];

  const TH = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: "6px 8px", border: "1px solid #9ca3af", fontSize: 11,
    fontWeight: 700, background: "#1e3a5f", color: "#fff", textAlign: "center", ...extra,
  });
  const TD = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    padding: "7px 8px", border: "1px solid #d1d5db", fontSize: 12, ...extra,
  });

  const etlCfg: Record<EtlStatus, { color: string; bg: string; label: string; dot: string }> = {
    idle: { color: "#6b7280", bg: "#f3f4f6", label: "Chờ đồng bộ", dot: "#9ca3af" },
    running: { color: "#1d4ed8", bg: "#eff6ff", label: "Đang đồng bộ...", dot: "#3b82f6" },
    done: { color: "#059669", bg: "#d1fae5", label: "Đồng bộ thành công", dot: "#10b981" },
    error: { color: "#dc2626", bg: "#fee2e2", label: "Lỗi kết nối", dot: "#ef4444" },
  };
  const esc = etlCfg[etlStatus];

  const pipeColor: Record<string, string> = { idle: "#9ca3af", running: "#2563eb", done: "#059669", error: "#dc2626" };
  const pipeLabel: Record<string, string> = { idle: "Chờ", running: "Đang chạy...", done: "Hoàn thành", error: "Lỗi" };
  const pipeStatus = [
    { icon: "📊", label: "ETL Pipeline 1", sub: "Sản xuất → Staging", s: etlStatus as string },
    { icon: "👷", label: "ETL Pipeline 2", sub: "Nhân sự → Staging", s: etlStatus as string },
    { icon: "📦", label: "ETL Pipeline 3", sub: "Vật tư → Staging", s: etlStatus as string },
    { icon: "📤", label: "ETL Pipeline 4", sub: "Staging → Báo cáo TKV", s: syncDone ? "done" : etlStatus === "running" ? "running" : "idle" },
  ];

  const inp = (val: string, setter: (v: string) => void, ph: string, isPass = false) => (
    <input
      type={isPass ? "password" : "text"}
      value={val}
      onChange={e => setter(e.target.value)}
      placeholder={ph}
      style={{ border: "1px solid #d1d5db", borderRadius: 5, padding: "5px 8px", fontSize: 11, width: "100%", fontFamily: "inherit" }}
    />
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#1f2937" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(6px);}to{opacity:1;transform:translateY(0);}}
        .fb{background:#e2e8f0;border:none;padding:5px 13px;border-radius:5px;cursor:pointer;font-size:12px;font-family:inherit;color:#374151;font-weight:500;transition:all 0.12s;}
        .fb.on{background:#1e3a5f;color:#fff;}
        .fb:hover:not(.on){background:#cbd5e1;}
        tr:hover>td{background:#eff6ff!important;}
      `}</style>

      {/* ─── HEADER ─── */}
      <div style={{ background: "#fff", borderBottom: "3px solid #1e3a5f", padding: "10px 18px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 64, height: 64, background: "#1e3a5f", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>⛏</div>
            <div style={{ fontSize: 7, color: "#93c5fd", lineHeight: 1.3 }}>CÔNG TY<br />ĐÈO NAI</div>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 19, fontWeight: 800, color: "#1e3a5f", letterSpacing: "-0.2px" }}>
            BÁO CÁO ĐIỀU HÀNH SẢN XUẤT & NHÂN SỰ
          </h1>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
            Công ty Cổ phần Than Đèo Nai Cọc Sáu — Hôm nay: {todayStr}
          </div>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 5, fontWeight: 600, textAlign: "center" }}>Thời Gian</div>
            <div style={{ display: "flex", gap: 4 }}>
              {TIME_FILTERS.map(f => (
                <button key={f} className={`fb${timeFilter === f ? " on" : ""}`} onClick={() => setTimeFilter(f)}>{f}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 5, fontWeight: 600, textAlign: "center" }}>Phân Xưởng</div>
            <div style={{ display: "flex", gap: 4 }}>
              {WORKSHOPS.map(w => (
                <button key={w} className={`fb${workshop === w ? " on" : ""}`} onClick={() => setWorkshop(w)}>{w}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

        {/* ─── ROW 1: KPI CARDS ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>

          {/* ── Card Than Nguyên Khai (layout mới từ doc 3) ── */}
          <div style={{
            background: "#fff", borderRadius: 12, boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
            padding: 18, height: 160, display: "flex", flexDirection: "column", justifyContent: "space-between",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#64748b" }}>
              TỔNG THAN NGUYÊN KHAI LŨY KẾ (TẤN)
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* KPI number */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 40, fontWeight: 800, color: "#0f172a", fontFamily: "monospace", lineHeight: 1 }}>
                  {MOCK.coalMTD.toLocaleString("vi-VN")}
                </div>
                <div style={{ fontSize: 13, marginTop: 6 }}>
                  Hôm nay{" "}
                  <b style={{ color: "#2563eb" }}>{MOCK.coalToday.toLocaleString("vi-VN")} tấn</b>
                </div>
              </div>
              {/* Sparkline */}
              <div style={{ flex: 1 }}>
                <Sparkline data={MOCK.coal7Days} color="#2563eb" />
                <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 1, textAlign: "center" }}>7 ngày qua</div>
              </div>
              {/* Gauge */}
              <div style={{ textAlign: "center", width: 90 }}>
                <Gauge value={MOCK.coalQuality} max={20} size={70} color="#f59e0b" />
                <div style={{ fontSize: 16, fontWeight: 800, color: "#f59e0b", marginTop: 4 }}>
                  {MOCK.coalQuality}%
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Chất lượng (Ak)</div>
              </div>
            </div>
          </div>

          {/* ── Card Mét Đào ── */}
          <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.09)", overflow: "hidden" }}>
            <div style={{ background: "#1e3a5f", color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 800, textAlign: "center" }}>
              MÉT ĐÀO LÒ MỚI LŨY KẾ (MÉT)
            </div>
            <div style={{ padding: "12px 14px", display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 38, fontWeight: 800, color: "#1f2937", fontFamily: "monospace", letterSpacing: "-2px", lineHeight: 1 }}>
                  {MOCK.tunnelMTD}
                </div>
                <div style={{ marginTop: 6, fontSize: 11, color: "#64748b" }}>Thực hiện hôm nay</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#1e3a5f", fontFamily: "monospace" }}>{MOCK.tunnelToday} m</div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ height: 7, background: "#e2e8f0", borderRadius: 4 }}>
                    <div style={{ height: "100%", width: "65%", background: "linear-gradient(90deg,#1a56db,#60a5fa)", borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 3 }}>Plan hiện tháng progress (65%)</div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#64748b", fontWeight: 700, marginBottom: 5 }}>Cơ cấu Mét Đào</div>
                <MiniBarChart data={MOCK.tunnelBreakdown} />
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  {[["#1a56db", "PX1"], ["#f59e0b", "PX2"]].map(([c, l]) => (
                    <div key={l} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "#64748b" }}>
                      <div style={{ width: 8, height: 8, background: c, borderRadius: 2 }} />{l}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Card Nhân Lực ── */}
          <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.09)", overflow: "hidden" }}>
            <div style={{ background: "#1e3a5f", color: "#fff", padding: "6px 12px", fontSize: 11, fontWeight: 800, textAlign: "center" }}>
              TỔNG NHÂN LỰC
            </div>
            <div style={{ padding: "12px 14px" }}>
              <div style={{ fontSize: 38, fontWeight: 800, color: "#1f2937", fontFamily: "monospace", letterSpacing: "-2px", lineHeight: 1, marginBottom: 10 }}>
                {MOCK.workforce.total.toLocaleString("vi-VN")}
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 5 }}>Đi làm</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ background: "#1e3a5f", color: "#fff", borderRadius: 7, padding: "5px 10px", fontSize: 18, fontWeight: 800, fontFamily: "monospace" }}>
                      {MOCK.workforce.diLam}
                    </div>
                    {[
                      { v: MOCK.workforce.diLamBreakdown.thoLo, c: "#1a56db", bg: "#eff6ff" },
                      { v: MOCK.workforce.diLamBreakdown.dienCo, c: "#f59e0b", bg: "#fffbeb" },
                      { v: MOCK.workforce.diLamBreakdown.bch, c: "#10b981", bg: "#ecfdf5" },
                    ].map((s, i) => (
                      <div key={i} style={{ background: s.bg, color: s.c, borderRadius: 6, padding: "4px 8px", fontSize: 14, fontWeight: 800, fontFamily: "monospace", border: `1px solid ${s.c}44` }}>
                        {s.v}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 3 }}>Đi làm (Thợ lò | Điện cơ | BCH)</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600, marginBottom: 3 }}>Vắng/Nghi</div>
                  <DonutSmall values={[MOCK.workforce.vang, MOCK.workforce.nghi, MOCK.workforce.absent]} colors={["#f59e0b", "#9ca3af", "#ef4444"]} size={62} />
                  <div style={{ fontSize: 9, color: "#64748b" }}>{MOCK.workforce.vang}v / {MOCK.workforce.nghi}p</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#64748b", fontWeight: 600, marginBottom: 3 }}>Nghi lũy kế</div>
                  <Gauge value={Math.round(MOCK.workforce.nghiLuyKe / MOCK.workforce.total * 100)} color="#ef4444" size={62} />
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#ef4444", fontFamily: "monospace" }}>{MOCK.workforce.nghiLuyKe}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── ROW 2: WORKER TABLE + PRODUCTION ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 12 }}>

          {/* Worker Table */}
          <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.09)", overflow: "hidden" }}>
            <div style={{ background: "#1e3a5f", color: "#fff", padding: "7px 14px", fontSize: 12, fontWeight: 800, textAlign: "center" }}>
              BẢNG CÔNG NHÂN LỰC CHI TIẾT
            </div>
            <div style={{ overflowX: "auto", padding: "10px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th rowSpan={2} style={TH({ minWidth: 90 })}>Nhân lực</th>
                    <th rowSpan={2} style={TH({ width: 30 })}>Ô</th>
                    <th rowSpan={2} style={TH({ width: 30 })}>F</th>
                    <th rowSpan={2} style={TH({ width: 30 })}>TT</th>
                    <th rowSpan={2} style={TH({ width: 30 })}>H</th>
                    <th rowSpan={2} style={TH({ width: 30 })}>V</th>
                    <th colSpan={4} style={TH({ background: "#d97706", borderColor: "#92400e" })}>Đi làm</th>
                    <th rowSpan={2} style={TH({ background: "#dc2626", minWidth: 60 })}>T.Lò vắng</th>
                    <th rowSpan={2} style={TH({ background: "#dc2626", minWidth: 60 })}>C.Điện vắng</th>
                  </tr>
                  <tr>
                    {["T.Lò", "Điện", "cơ", "BCH"].map(h => (
                      <th key={h} style={TH({ background: "#b45309", borderColor: "#92400e", fontSize: 10 })}>{h}</th>
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
                        <td style={TD({ textAlign: "center", background: rowBg, ...(row.highlight && row.o === 1 ? { color: "#dc2626", fontWeight: 800 } : {}) })}>{row.o}</td>
                        <td style={TD({ textAlign: "center", background: rowBg, ...(row.highlight && row.f === 0 ? { color: "#dc2626", fontWeight: 800 } : {}) })}>{row.f}</td>
                        <td style={TD({ textAlign: "center", background: rowBg })}>{row.tt}</td>
                        <td style={TD({ textAlign: "center", background: rowBg })}>{row.h}</td>
                        <td style={TD({ textAlign: "center", background: rowBg })}>{row.v}</td>
                        <td style={{ ...TD({ textAlign: "center" }), ...hl, fontWeight: 700 }}>{row.tLo ?? ""}</td>
                        <td style={{ ...TD({ textAlign: "center" }), ...hl, fontWeight: 700 }}>{row.dien ?? ""}</td>
                        <td style={{ ...TD({ textAlign: "center" }), ...hl, fontWeight: 700 }}>{row.co ?? ""}</td>
                        <td style={{ ...TD({ textAlign: "center" }), ...hl, fontWeight: 700 }}>{row.bch ?? ""}</td>
                        <td style={{ ...TD({ textAlign: "center", background: rowBg }), color: row.tLoVang ? "#dc2626" : "#1f2937", fontWeight: row.tLoVang ? 800 : 400 }}>
                          {row.tLoVang ?? ""}
                        </td>
                        <td style={{ ...TD({ textAlign: "center", background: rowBg }), color: row.cdienVang === 0 ? "#059669" : "#1f2937", fontWeight: row.cdienVang === 0 ? 700 : 400 }}>
                          {row.cdienVang === 0 ? "0" : (row.cdienVang ?? "")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Production + Logistics */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.09)", overflow: "hidden", flex: 1 }}>
              <div style={{ background: "#1e3a5f", color: "#fff", padding: "7px 14px", fontSize: 12, fontWeight: 800, textAlign: "center" }}>
                KẾT QUẢ SẢN XUẤT HÔM NAY VS LŨY KẾ
              </div>
              <div style={{ padding: "10px", display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr>
                      {["Chi tiêu", "Đ.vị", "Thực hiện hôm nay", "Lũy kế tháng"].map(h => (
                        <th key={h} style={TH({ fontSize: 10, padding: "5px 7px" })}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK.productionTable.map((row, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                        <td style={TD({ fontWeight: 500, fontSize: 11 })}>{row.chiTieu}</td>
                        <td style={TD({ textAlign: "center", color: "#6b7280", fontSize: 11 })}>{row.dvj}</td>
                        <td style={TD({ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#1e3a5f" })}>
                          {typeof row.homNay === "number" ? row.homNay.toLocaleString("vi-VN") : row.homNay}
                        </td>
                        <td style={TD({ textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "#1a56db" })}>
                          {typeof row.luyKe === "number" ? row.luyKe.toLocaleString("vi-VN") : row.luyKe}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ minWidth: 160 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#1e3a5f", textAlign: "center", marginBottom: 6, background: "#e0f2fe", padding: "4px 8px", borderRadius: 5 }}>
                    TIÊU THỤ & GIAO THAN
                  </div>
                  <table style={{ borderCollapse: "collapse", width: "100%" }}>
                    <thead>
                      <tr>
                        {["Chi tiêu", "Đ.vị", "Tháng"].map(h => (
                          <th key={h} style={TH({ fontSize: 10, padding: "5px 7px" })}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK.logisticsTable.map((row, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? "#f9fafb" : "#fff" }}>
                          <td style={TD({ fontSize: 11, fontWeight: 500, maxWidth: 100 })}>{row.chiTieu}</td>
                          <td style={TD({ textAlign: "center", color: "#6b7280", fontSize: 11 })}>{row.dvj}</td>
                          <td style={TD({ textAlign: "right", fontFamily: "monospace", fontWeight: 800, color: "#1e3a5f", fontSize: 13 })}>{row.thang}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── ROW 3: ETL ─── */}
        <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.09)", overflow: "hidden" }}>
          <div style={{ background: "#1e3a5f", color: "#fff", padding: "7px 14px", fontSize: 12, fontWeight: 800, textAlign: "center" }}>
            QUẢN TRỊ DỮ LIỆU VÀ PIPELINE ETL
          </div>
          <div style={{ padding: "14px 16px", display: "grid", gridTemplateColumns: "300px 1fr 1fr", gap: 16 }}>

            {/* DB Config */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e3a5f", marginBottom: 10 }}>🔧 Cấu hình kết nối</div>

              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#0369a1", marginBottom: 8, textTransform: "uppercase" as const }}>📊 DB Báo cáo sản xuất</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 6, marginBottom: 6 }}>
                  <div><div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>IP/Host Server</div>{inp(dbBaoCao.ip, v => setDbBaoCao(p => ({ ...p, ip: v })), "192.168.1.100")}</div>
                  <div><div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>Port Server</div>{inp(dbBaoCao.port, v => setDbBaoCao(p => ({ ...p, port: v })), "1433")}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div><div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>Username Server</div>{inp(dbBaoCao.user, v => setDbBaoCao(p => ({ ...p, user: v })), "sa")}</div>
                  <div><div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>Password Server</div>{inp(dbBaoCao.pass, v => setDbBaoCao(p => ({ ...p, pass: v })), "••••••", true)}</div>
                </div>
              </div>

              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#15803d", marginBottom: 8, textTransform: "uppercase" as const }}>👷 DB Nhân sự</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 6, marginBottom: 6 }}>
                  <div><div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>IP/Host Server</div>{inp(dbNhanSu.ip, v => setDbNhanSu(p => ({ ...p, ip: v })), "192.168.1.101")}</div>
                  <div><div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>Port Server</div>{inp(dbNhanSu.port, v => setDbNhanSu(p => ({ ...p, port: v })), "1433")}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <div><div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>Username Server</div>{inp(dbNhanSu.user, v => setDbNhanSu(p => ({ ...p, user: v })), "sa")}</div>
                  <div><div style={{ fontSize: 9, color: "#64748b", marginBottom: 2 }}>Password Server</div>{inp(dbNhanSu.pass, v => setDbNhanSu(p => ({ ...p, pass: v })), "••••••", true)}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <div style={{ flex: 1, background: "#e2e8f0", borderRadius: 6, padding: "6px 10px", fontSize: 10, color: "#475569", textAlign: "center" as const }}>
                  {syncDone ? "✓ Dữ liệu đồng bộ" : "Dữ liệu đồng bộ"}
                </div>
                <div style={{ flex: 1, background: "#e2e8f0", borderRadius: 6, padding: "6px 10px", fontSize: 10, color: "#475569", textAlign: "center" as const }}>Di lướt</div>
              </div>

              <button onClick={handleSync} disabled={syncing} style={{
                width: "100%", background: syncing ? "#6b7280" : "#1e3a5f", color: "#fff", border: "none",
                borderRadius: 8, padding: "11px", fontSize: 13, fontWeight: 800, cursor: syncing ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                {syncing
                  ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> Đang đồng bộ...</>
                  : "⬇  ĐỒNG BỘ NGAY"}
              </button>

              <div style={{ marginTop: 8, padding: "7px 12px", borderRadius: 7, background: esc.bg, display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: esc.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: esc.color, fontWeight: 700 }}>{esc.label}</span>
              </div>

              {syncDone && (
                <button onClick={() => setShowPdfModal(true)} style={{
                  width: "100%", background: "#059669", color: "#fff", border: "none",
                  borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                  marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  animation: "fadeUp 0.3s ease",
                }}>
                  📄 Xem báo cáo vật tư đã đồng bộ (PDF)
                </button>
              )}
            </div>

            {/* Pipeline visual */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e3a5f", marginBottom: 10 }}>🔄 ETL Pipeline Flow</div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px", height: "calc(100% - 30px)", display: "flex", flexDirection: "column", gap: 8, justifyContent: "center" }}>
                {pipeStatus.map((p, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#fff", borderRadius: 8, border: `1px solid ${pipeColor[p.s]}33` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: pipeColor[p.s] + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                      {p.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1f2937" }}>{p.label}</div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>{p.sub}</div>
                    </div>
                    <div style={{ textAlign: "right" as const }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: pipeColor[p.s] }}>{pipeLabel[p.s]}</div>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: pipeColor[p.s], marginLeft: "auto", marginTop: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ETL Log */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e3a5f", marginBottom: 10 }}>📋 Nhật ký nạp dữ liệu</div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", height: "calc(100% - 30px)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 55px", padding: "7px 12px", background: "#1e3a5f" }}>
                  {["Thời gian", "Nội dung", "Trạng thái"].map(h => (
                    <span key={h} style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{h}</span>
                  ))}
                </div>
                <div style={{ maxHeight: 180, overflowY: "auto" }}>
                  {MOCK.etlLog.map((row, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 1fr 55px", padding: "7px 12px", background: i % 2 === 0 ? "#f9fafb" : "#fff", borderBottom: "1px solid #e5e7eb" }}>
                      <span style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace" }}>{row.ts}</span>
                      <span style={{ fontSize: 10, color: "#374151" }}>{row.hogKy}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: row.log === "OK" ? "#059669" : row.log === "Warn" ? "#d97706" : "#dc2626" }}>{row.log}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 10, background: "#fafafa", border: "1px dashed #d1d5db", borderRadius: 8, padding: "12px", textAlign: "center" as const }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#1e3a5f", marginBottom: 6 }}>CẤU HÌNH QUYỀN XEM BÁO CÁO</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
                  {[["👤", "Quản lý"], ["👥", "Phân xưởng"], ["🔐", "Tập đoàn"]].map(([icon, lbl]) => (
                    <div key={lbl} style={{ textAlign: "center" as const }}>
                      <div style={{ fontSize: 28 }}>{icon}</div>
                      <div style={{ fontSize: 9, color: "#64748b" }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PDF MODAL ─── */}
      {showPdfModal && <SyncPdfModal onClose={() => setShowPdfModal(false)} />}
    </div>
  );
}