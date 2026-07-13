import { createContext, useContext, type ReactNode } from "react";

export interface TenantConfig {
  clientId: string;
  appTitle: string;
  companyName: string;
  phone: string;
  email: string;
  copyright: string;
  primaryColor: string;
  navColor: string;
  logoFile: string;
  bannerFile: string;
  apiTarget: string;
  apiUrl: string;
}


const tenantConfig: TenantConfig = {
  clientId:     import.meta.env.VITE_TENANT         ?? "default",
  appTitle:     import.meta.env.VITE_APP_TITLE      ?? "Data Lake",
  companyName:  import.meta.env.VITE_COMPANY_NAME   ?? "Kho dữ liệu tập trung",
  phone:        import.meta.env.VITE_HOTLINE         ?? "",
  email:        import.meta.env.VITE_EMAIL           ?? "",
  copyright:    import.meta.env.VITE_COPYRIGHT       ?? "© 2024 Ecotel. All rights reserved.",
  primaryColor: import.meta.env.VITE_PRIMARY_COLOR   ?? "#1a8649",
  navColor:     import.meta.env.VITE_PRIMARY_DARK    ?? "#0a5232",
  logoFile:     import.meta.env.VITE_LOGO_FILE       ?? "",
  bannerFile:   import.meta.env.VITE_BANNER_FILE     ?? "background.png",
  apiTarget:    import.meta.env.VITE_DATALAKE_API    ?? "",
  apiUrl:       import.meta.env.VITE_API             ?? "http://localhost:8080/api",
};

// Inject màu vào CSS variables ngay lúc module load (synchronous)
document.documentElement.style.setProperty("--primary-color", tenantConfig.primaryColor);
document.documentElement.style.setProperty("--nav-color",     tenantConfig.navColor);
document.documentElement.style.setProperty("--primary",       tenantConfig.primaryColor);
document.documentElement.style.setProperty("--primary-dark",  tenantConfig.navColor);

// Cập nhật tiêu đề trang (Tab Title)
if (tenantConfig.appTitle) {
  document.title = tenantConfig.appTitle;
}

// Cập nhật favicon (Tab Icon)
const favicon = document.querySelector("link[rel*='icon']");
if (favicon) {
  const logoPath = tenantConfig.logoFile
    ? (tenantConfig.logoFile.startsWith('/') ? tenantConfig.logoFile : `/${tenantConfig.logoFile}`)
    : "/logo-company.png";
  favicon.setAttribute("href", logoPath);
}

// Hàm đồng bộ cho các module ngoài React (axiosClient, axiosDataLakeClient)
export const getTenantConfig = (): TenantConfig => tenantConfig;

// ── React Context ──────────────────────────────────────────────
interface TenantContextType {
  tenant: TenantConfig;
}

const TenantContext = createContext<TenantContextType>({ tenant: tenantConfig });

export const TenantProvider = ({ children }: { children: ReactNode }) => (
  <TenantContext.Provider value={{ tenant: tenantConfig }}>
    {children}
  </TenantContext.Provider>
);

export const useTenant = () => useContext(TenantContext);
