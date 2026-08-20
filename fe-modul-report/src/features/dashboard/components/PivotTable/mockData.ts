// ─── Mock Data: 5 chỉ tiêu × 6 tháng ────────────────────────────────────────
// Mỗi bản ghi đại diện cho kết quả sản xuất 1 chỉ tiêu trong 1 tháng

export interface ProductionRecord {
  id: string;
  chiTieu: string;
  donVi: string;
  thang: string;
  thangNum: number;
  keHoach: number;
  thucHien: number;
  phanXuong: string;
}

const CHI_TIEU = [
  {
    name: "Than NK sản xuất",
    don_vi: "Tấn",
    px: "PX Than Nguyên Khai",
    baseKH: 30000,
  },
  {
    name: "Mét lò đào mới",
    don_vi: "m",
    px: "PX Than Nguyên Khai",
    baseKH: 600,
  },
  { name: "XDCB", don_vi: "m", px: "PX Cơ điện", baseKH: 75 },
  { name: "CBSX", don_vi: "m", px: "PX Cơ điện", baseKH: 470 },
  { name: "Mò xén", don_vi: "m", px: "PX Than Nguyên Khai", baseKH: 60 },
];

// Seed-based pseudo-random để data ổn định
const pseudo = (seed: number) => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

// Tỷ lệ thực hiện theo tháng (mô phỏng xu hướng tăng dần Q1→Q2)
const MONTH_RATES = [0.82, 0.88, 0.95, 0.91, 1.03, 1.07];

let _id = 0;
const records: ProductionRecord[] = [];

CHI_TIEU.forEach((ct, ci) => {
  for (let m = 1; m <= 6; m++) {
    const baseRate = MONTH_RATES[m - 1];
    const noise = pseudo(ci * 100 + m) * 0.12 - 0.06; // ±6%
    const rate = Math.max(0.7, baseRate + noise);

    const keHoach = Math.round(ct.baseKH);
    const thucHien = Math.round(ct.baseKH * rate);

    records.push({
      id: `rec-${++_id}`,
      chiTieu: ct.name,
      donVi: ct.don_vi,
      thang: `T${m}/2026`,
      thangNum: m,
      keHoach,
      thucHien,
      phanXuong: ct.px,
    });
  }
});

export const PRODUCTION_MOCK: ProductionRecord[] = records;

// Available fields để PivotConfigModal dùng
export const AVAILABLE_ROW_FIELDS = [
  { key: "chiTieu", label: "Chỉ tiêu sản xuất", type: "string" as const },
  { key: "phanXuong", label: "Phân xưởng", type: "string" as const },
];

export const AVAILABLE_COLUMN_FIELDS = [
  { key: "thang", label: "Tháng", type: "string" as const },
  { key: "chiTieu", label: "Chỉ tiêu", type: "string" as const },
];

export const AVAILABLE_VALUE_FIELDS = [
  {
    key: "keHoach",
    label: "Kế hoạch",
    type: "number" as const,
    format: "compact" as const,
    locale: "vi-VN",
    unit: "",
  },
  {
    key: "thucHien",
    label: "Thực hiện",
    type: "number" as const,
    format: "compact" as const,
    locale: "vi-VN",
    unit: "",
  },
];
