import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  MailOutlined,
  PhoneOutlined,
  UserOutlined,
  DownOutlined,
  LogoutOutlined,
  ProfileOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Menu } from "antd";
import { useEffect, useState } from "react";
import logoUb from "../../file/logo-ub.jpg";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [showTop, setShowTop] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const isActive = (path: string) => location.pathname.startsWith(path);

  useEffect(() => {
    const onScroll = () => {
      const current = window.scrollY;

      if (current > lastScrollY && current > 80) {
        setShowTop(false);
      } else {
        setShowTop(true);
      }

      setLastScrollY(current);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [lastScrollY]);

  const categoryMenu = (
    <Menu
      items={[
        { key: "departments", label: "Phòng ban", onClick: () => navigate("/category/departments") },
        { key: "ware", label: "Danh mục TKV", onClick: () => navigate("/category/ware") },
      ]}
    />
  );

  const reportMenu = (
    <Menu
      items={[
        { key: "ware", label: "Báo cáo TKV", onClick: () => navigate("/ware") },
        { key: "search", label: "Tra cứu TKV", onClick: () => navigate("/search/master") },
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
        className={`bg-[#1a8649] border-b border-green-600 transition-all duration-300 overflow-hidden
        ${showTop ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="flex items-center justify-center px-6 py-3 text-white">
          <img
            src={logoUb}
            className="h-14 w-14 rounded-full cursor-pointer"
            onClick={() => navigate("/dashboard")}
          />

          <div className="ml-4 text-center">
            <div className="text-2xl font-bold">PHẦN MỀM QUẢN LÝ KHO DỮ LIỆU</div>
            <div className="text-base font-bold">CÔNG TY THAN UÔNG BÍ - TKV</div>

            <div className="flex justify-center gap-6 text-sm mt-1">
              <span className="flex items-center gap-1">
                <PhoneOutlined /> 02033.854491
              </span>
              <span className="flex items-center gap-1">
                <MailOutlined /> ctythanub@gmail.com
              </span>
            </div>
          </div>
        </div>
      </div>

      <nav className="top-0 z-50 bg-[#1a8649] flex items-center px-6 py-2 gap-2 shadow-md">
        <Link
          to="/dashboard"
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isActive("/dashboard")
              ? "bg-white text-green-700"
              : "text-white hover:bg-green-600"
          }`}
        >
          Trang chủ
        </Link>

        <Dropdown overlay={categoryMenu}>
          <Button
            type="text"
            className="text-white! hover:text-white! hover:bg-green-600"
          >
            Danh mục <DownOutlined />
          </Button>
        </Dropdown>

        <Link
          to="/employee"
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isActive("/employee")
              ? "bg-white text-green-700"
              : "text-white hover:bg-green-600"
          }`}
        >
          Nhân viên
        </Link>

        <Dropdown overlay={reportMenu}>
          <Button
            type="text"
            className="text-white! hover:text-white! hover:bg-green-600"
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
