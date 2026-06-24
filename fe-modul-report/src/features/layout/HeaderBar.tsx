import {useNavigate } from "react-router-dom";
import {
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { tenantConfig } from "../../config/tenant";
import logoUb from "../../file/logo-ub.jpg";
import logoDeonaicocsau from "../../file/logo-company.png";

// Asset map - khi thêm logo mới: thêm import và entry vào đây
const LOGO_MAP: Record<string, string> = {
  "logo-ub.jpg": logoUb,
  "logo-company.png": logoDeonaicocsau,
};
const logoSrc = LOGO_MAP[tenantConfig.logoFile] ?? logoDeonaicocsau;

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="w-full">
      <div
        className="border-b transition-all duration-300 overflow-hidden"
        style={{
          backgroundColor: tenantConfig.primaryColor,
          borderColor: tenantConfig.primaryDark,
        }}
      >
        <div
          className={`flex items-center justify-center px-6 py-3 text-white transition-all duration-300 `}
        >
          <img
            src={logoSrc}
            className="h-14 w-14 rounded-full cursor-pointer"
            onClick={() => navigate("/dashboard")}
          />

          <div className="ml-4 text-center">
            <div className="text-2xl font-bold">
              PHẦN MỀM QUẢN LÝ KHO DỮ LIỆU
            </div>
            <div className="text-base font-bold">
              {tenantConfig.companyName}
            </div>

            <div className="flex justify-center gap-6 text-sm mt-1">
              {tenantConfig.hotline && (
                <span className="flex items-center gap-1">
                  <PhoneOutlined /> {tenantConfig.hotline}
                </span>
              )}
              {tenantConfig.email && (
                <span className="flex items-center gap-1">
                  <MailOutlined /> {tenantConfig.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
