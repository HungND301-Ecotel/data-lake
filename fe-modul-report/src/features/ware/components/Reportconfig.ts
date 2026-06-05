/**
 * Report Configuration
 * Dễ dàng thêm báo cáo mới mà không cần sửa component
 */

export interface ReportConfig {
  key: string;
  name: string;
  displayName: string;
  metaColumns: string[];
  priorityColumns: string[];
  unitName?: string;
  company: {
    name: string;
    department: string;
  };
  totalContracts?: number;
}

export const DEFAULT_COMPANY = {
  name: "CÔNG TY CỬ NHÂN THAN UÔNG BÌ - VINACOMIN",
  department: "PHÒNG KỊ HOẠCH - VẬT TƯ",
};

export const DEFAULT_UNIT = "Đơn vị: Than Đèo Nai Cọc Sáu (TKV)";

/**
 * Danh sách các báo cáo có sẵn
 * Thêm báo cáo mới ở đây
 */
export const REPORT_CONFIG: Record<string, ReportConfig> = {
  tồn_kho: {
    key: "tồn_kho",
    name: "tồn_kho",
    displayName: "SỐ LIỆU TỒN KHO CUỐI NGÀY",
    metaColumns: [
      "mã đơn vị",
      "năm",
      "tháng",
      "ngày",
      "loại dữ liệu",
      "period",
      "ngay",
      "day",
      "type_data",
      "data_type",
      "loai_du_lieu",
      "ma_don_vi",
    ],
    priorityColumns: [
      "mã sản phẩm",
      "tên sản phẩm",
      "dvt",
      "số lượng tồn kho cuối ngày",
      "số lượng đi đường",
      "product_code",
      "product_name",
      "unit",
      "qty_onhand",
      "qty_in_transit",
    ],
    unitName: DEFAULT_UNIT,
    company: DEFAULT_COMPANY,
    totalContracts: 19,
  },

  hợp_đồng: {
    key: "hợp_đồng",
    name: "hợp_đồng",
    displayName: "SỐ THEO DÕI HỢP ĐỒNG",
    metaColumns: [
      "mã đơn vị",
      "năm",
      "tháng",
      "ngày",
      "loại dữ liệu",
      "period",
      "ngay",
      "day",
      "type_data",
    ],
    priorityColumns: [
      "mã hợp đồng",
      "tên hợp đồng",
      "bên a",
      "bên b",
      "giá trị",
      "contract_code",
      "contract_name",
    ],
    unitName: DEFAULT_UNIT,
    company: DEFAULT_COMPANY,
    totalContracts: 19,
  },

  báo_cáo_bán_hàng: {
    key: "báo_cáo_bán_hàng",
    name: "sales",
    displayName: "BÁO CÁO BÁN HÀNG",
    metaColumns: [
      "mã đơn vị",
      "năm",
      "tháng",
      "ngày",
      "loại dữ liệu",
      "period",
    ],
    priorityColumns: [
      "mã sản phẩm",
      "tên sản phẩm",
      "số lượng bán",
      "doanh thu",
      "product_code",
      "product_name",
      "sales_qty",
      "revenue",
    ],
    unitName: DEFAULT_UNIT,
    company: DEFAULT_COMPANY,
    totalContracts: 19,
  },

  báo_cáo_nhân_sự: {
    key: "báo_cáo_nhân_sự",
    name: "human_resources",
    displayName: "BÁO CÁO NHÂN SỰ",
    metaColumns: ["mã đơn vị", "năm", "tháng", "loại dữ liệu"],
    priorityColumns: [
      "mã nhân viên",
      "tên nhân viên",
      "chức vụ",
      "phòng ban",
      "employee_code",
      "employee_name",
      "position",
      "department",
    ],
    unitName: DEFAULT_UNIT,
    company: DEFAULT_COMPANY,
    totalContracts: 19,
  },
};

/**
 * Hàm lấy config báo cáo từ tên bảng
 * @param tableName - Tên bảng từ query param
 * @returns ReportConfig hoặc undefined
 */
export const getReportConfig = (tableName?: string): ReportConfig | undefined => {
  if (!tableName) return undefined;

  // Tìm trực tiếp
  if (REPORT_CONFIG[tableName]) {
    return REPORT_CONFIG[tableName];
  }

  // Tìm gần đúng (case-insensitive)
  const key = Object.keys(REPORT_CONFIG).find(
    (k) =>
      k.toLowerCase().includes(tableName.toLowerCase()) ||
      tableName.toLowerCase().includes(k.toLowerCase())
  );

  return key ? REPORT_CONFIG[key] : undefined;
};

/**
 * Hàm format thời gian báo cáo
 */
export const formatReportPeriod = (
  reportType?: "MONTH" | "YEAR" | "DAY",
  year?: number,
  period?: string,
  day?: string
): string => {
  if (!year) return "";

  const monthNames: Record<string, string> = {
    "1": "tháng 1",
    "2": "tháng 2",
    "3": "tháng 3",
    "4": "tháng 4",
    "5": "tháng 5",
    "6": "tháng 6",
    "7": "tháng 7",
    "8": "tháng 8",
    "9": "tháng 9",
    "10": "tháng 10",
    "11": "tháng 11",
    "12": "tháng 12",
  };

  if (reportType === "YEAR") {
    return `Lũy kế năm ${year}`;
  }

  if (reportType === "MONTH" && period) {
    return `Theo phần loai/linh vực HD — Lũy kế ${monthNames[period] || period} năm ${year}`;
  }

  if ((reportType === "DAY" || !reportType) && day) {
    return `Ngày ${day}/${period || ""}/${year}`.replace(/\/\//g, "/").trim();
  }

  return `Năm ${year}`;
};

/**
 * Hàm normalize tên cột để so sánh
 */
export const normalizeKey = (key: string): string => {
  return key
    .toLowerCase()
    .replace(/[_\s-]/g, "")
    .trim();
};

/**
 * Hàm kiểm tra xem cột có phải meta không
 */
export const isMetaColumn = (
  columnKey: string,
  reportConfig?: ReportConfig
): boolean => {
  const metaColumns = reportConfig?.metaColumns || [];
  const normalized = normalizeKey(columnKey);
  return metaColumns.some((meta) => normalized === normalizeKey(meta));
};

/**
 * Hàm sắp xếp cột theo priority
 */
export const sortColumnsByPriority = (
  keys: string[],
  reportConfig?: ReportConfig
): string[] => {
  const priorityColumns = reportConfig?.priorityColumns || [];

  return [
    ...priorityColumns.filter((k) => keys.includes(k)),
    ...keys.filter(
      (k) =>
        !priorityColumns.includes(k) &&
        !isMetaColumn(k, reportConfig)
    ),
  ];
};