import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  DownOutlined,
  LogoutOutlined,
  ProfileOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Menu } from "antd";
import logoUb from "../../file/logo-company.png";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname.startsWith(path);
  const categoryMenu = (
    <Menu
      items={[
        {
          key: "departments",
          label: "Phòng ban",
          onClick: () => navigate("/category/departments"),
        },
        {
          key: "ware",
          label: "Danh mục TKV",
          onClick: () => navigate("/category/ware"),
        },
      ]}
    />
  );

  const reportMenu = (
    <Menu
      items={[
        { key: "ware", label: "Báo cáo TKV", onClick: () => navigate("/ware") },
        {
          key: "search",
          label: "Tra cứu TKV",
          onClick: () => navigate("/search/master"),
        },
      ]}
    />
  );

  const accountMenu = (
    <Menu
      items={[
        {
          key: "profile",
          icon: <ProfileOutlined />,
          label: "Hồ sơ cá nhân",
          onClick: () => navigate("/employee/profile"),
        },
        { type: "divider" },
        {
          key: "logout",
          icon: <LogoutOutlined />,
          danger: true,
          label: "Đăng xuất",
          onClick: () => navigate("/login"),
        },
      ]}
    />
  );
  return (
    <header className="w-full">
      <div
        className={`bg-[#0891b2] border-b border-cyan-600 transition-all duration-300 overflow-hidden`}
      >
        <div
          className={`flex items-center justify-center px-6 py-3 text-white transition-all duration-300 `}
        >
          <img
            src={logoUb}
            className="h-14 w-20 rounded-full cursor-pointer"
            onClick={() => navigate("/dashboard")}
          />

          <div className="ml-4 text-center">
            <div className="text-2xl font-bold">
              PHẦN MỀM QUẢN LÝ KHO DỮ LIỆU
            </div>
            <div className="text-base font-bold">
              CÔNG TY KHO VẬN ĐÁ BẠC - TKV
            </div>

            <div className="flex justify-center gap-6 text-sm mt-1">
              <span className="flex items-center gap-1">
                <PhoneOutlined /> 020.33565388
              </span>
              <span className="flex items-center gap-1">
                <MailOutlined /> 020.33565399
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav className="top-0 z-50 bg-[#0891b2] flex items-center px-6 py-2 gap-2 shadow-md">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="text-white! hover:text-white! hover:bg-cyan-600"
        ></Button>
        <Link
          to="/dashboard"
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isActive("/dashboard")
              ? "bg-white text-cyan-700"
              : "text-white hover:bg-cyan-600"
          }`}
        >
          Trang chủ
        </Link>

        <Dropdown overlay={categoryMenu}>
          <Button
            type="text"
            className="text-white! hover:text-white! hover:bg-cyan-600"
          >
            Danh mục <DownOutlined />
          </Button>
        </Dropdown>

        <Link
          to="/employee"
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isActive("/employee")
              ? "bg-white text-cyan-700"
              : "text-white hover:bg-cyan-600"
          }`}
        >
          Nhân viên
        </Link>

        <Dropdown overlay={reportMenu}>
          <Button
            type="text"
            className="text-white! hover:text-white! hover:bg-cyan-600"
          >
            Báo cáo <DownOutlined />
          </Button>
        </Dropdown>

        <div className="ml-auto">
          <Dropdown overlay={accountMenu} placement="bottomRight">
            <Button type="text" className="text-white!">
              <UserOutlined />
            </Button>
          </Dropdown>
        </div>
      </nav>
    </header>
  );
};

export default Header;