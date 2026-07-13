import {useNavigate } from "react-router-dom";
import {
  MailOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { useTenant } from "../../config/tenant";
const Header = () => {
  const navigate = useNavigate();
  const { tenant } = useTenant();

  const logoSrc = tenant.logoFile
    ? (tenant.logoFile.startsWith('/') ? tenant.logoFile : `/${tenant.logoFile}`)
    : "/logo-company.png";

  return (
    <header className="w-full">
      <div
        className="border-b transition-all duration-300 overflow-hidden"
        style={{
          backgroundColor: tenant.primaryColor,
          borderColor: tenant.navColor,
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
              {tenant.companyName}
            </div>

            <div className="flex justify-center gap-6 text-sm mt-1">
              {tenant.phone && (
                <span className="flex items-center gap-1">
                  <PhoneOutlined /> {tenant.phone}
                </span>
              )}
              {tenant.email && (
                <span className="flex items-center gap-1">
                  <MailOutlined /> {tenant.email}
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
