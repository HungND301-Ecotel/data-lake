// ============================================================
// Tenant Configuration
// ============================================================
// Các giá trị này được inject lúc build bởi Vite từ file
// fe-modul-report/tenants/{tenant}.env
//
// Để thêm config mới cho tenant:
//   1. Thêm biến VITE_* vào file tenants/{tenant}.env
//   2. Thêm field tương ứng vào object bên dưới
// ============================================================

export const tenantConfig = {
  /** Tên tenant (vd: uongbi, deonaicocsau) */
  tenant: import.meta.env.VITE_TENANT || "default",

  /** Tiêu đề hiển thị trên tab trình duyệt & tên app */
  appTitle: import.meta.env.VITE_APP_TITLE || "Hệ thống báo cáo",

  /** Màu chủ đạo của navbar và các accent color */
  primaryColor: import.meta.env.VITE_PRIMARY_COLOR || "#1a8649",

  /** Màu border/shadow dưới navbar (thường tối hơn primaryColor 1 tone) */
  primaryDark: import.meta.env.VITE_PRIMARY_DARK || "#0a5232",

  /** Base URL của API backend */
  apiUrl: import.meta.env.VITE_API || "http://localhost:8080/api",

  // ── Thông tin hiển thị trang Login ──────────────────────────

  /** Tên công ty hiển thị trên header trang login */
  companyName: import.meta.env.VITE_COMPANY_NAME || "HỆ THỐNG BÁO CÁO",

  /** Hotline hiển thị trên trang login */
  hotline: import.meta.env.VITE_HOTLINE || "",

  /** Email hiển thị trên trang login */
  email: import.meta.env.VITE_EMAIL || "",

  /** Text copyright ở footer trang login */
  copyright: import.meta.env.VITE_COPYRIGHT || "© 2024 Ecotel. All rights reserved.",

  /** Đường dẫn logo trong src/file/ (dùng import động, xem LoginPage) */
  logoFile: import.meta.env.VITE_LOGO_FILE || "logo-company.png",

  /** Đường dẫn banner/background trong src/file/ */
  bannerFile: import.meta.env.VITE_BANNER_FILE || "background.png",
} as const;

export type TenantConfig = typeof tenantConfig;
