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

// Available fields để PivotConfigBar dùng
export const AVAILABLE_ROW_FIELDS = [
  { key: "chiTieu", label: "Chỉ tiêu sản xuất", type: "string" as const },
  { key: "phanXuong", label: "Phân xưởng / Bộ phận", type: "string" as const },
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
