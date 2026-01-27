import { Link, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  DownOutlined,
  LogoutOutlined,
  ProfileOutlined,
  ArrowLeftOutlined,
  HomeOutlined,
  AppstoreOutlined,
  TeamOutlined,
  FileTextOutlined,
  IdcardOutlined,
  FormOutlined,
  BarChartOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Menu } from "antd";

export default function NavBar() {
  const navigate = useNavigate();

  const categoryMenu = (
    <Menu
      items={[
        {
          key: "departments",
          icon: <TeamOutlined className="text-lg" />,
          label: (
            <span className="text-base font-medium">Danh mục phòng ban</span>
          ),
          onClick: () => navigate("/category/departments"),
          className: "py-3 px-4 hover:bg-[#f0f9f4]!",
        },
        {
          key: "ware",
          icon: <FileTextOutlined className="text-lg" />,
          label: (
            <span className="text-base font-medium">Danh mục báo cáo</span>
          ),
          onClick: () => navigate("/category/ware"),
          className: "py-3 px-4 hover:bg-[#f0f9f4]!",
        },
        {
          key: "employee",
          icon: <IdcardOutlined className="text-lg" />,
          label: (
            <span className="text-base font-medium">Danh mục tài khoản</span>
          ),
          onClick: () => navigate("/employee"),
          className: "py-3 px-4 hover:bg-[#f0f9f4]!",
        },
      ]}
      className="rounded-xl! shadow-2xl! min-w-[260px] py-2"
    />
  );

  const reportsMenu = (
    <Menu
      items={[
        {
          key: "view",
          icon: <EyeOutlined className="text-lg" />,
          label: <span className="text-base font-medium">Xem báo cáo</span>,
          onClick: () => navigate("/search/master"),
          className: "py-3 px-4 hover:bg-[#f0f9f4]!",
        },
        {
          key: "approve",
          icon: <CheckCircleOutlined className="text-lg" />,
          label: <span className="text-base font-medium">Duyệt báo cáo</span>,
          onClick: () => navigate("/approve/batch"),
          className: "py-3 px-4 hover:bg-[#f0f9f4]!",
        },
        {
          key: "sync",
          icon: <SyncOutlined className="text-lg" />,
          label: <span className="text-base font-medium">Đồng bộ báo cáo</span>,
          onClick: () => navigate("/sync/batch"),
          className: "py-3 px-4 hover:bg-[#f0f9f4]!",
        },
      ]}
      className="rounded-xl! shadow-2xl! min-w-[260px] py-2"
    />
  );

  const accountMenu = (
    <Menu
      items={[
        {
          key: "profile",
          icon: <ProfileOutlined className="text-lg" />,
          label: <span className="text-base font-medium">Hồ sơ cá nhân</span>,
          onClick: () => navigate("/employee/profile"),
          className: "py-3 px-4 hover:bg-[#f0f9f4]!",
        },
        { type: "divider", className: "my-2" },
        {
          key: "logout",
          icon: <LogoutOutlined className="text-lg" />,
          danger: true,
          label: <span className="text-base font-medium">Đăng xuất</span>,
          onClick: () => navigate("/login"),
          className: "py-3 px-4 hover:bg-[#fff1f0]!",
        },
      ]}
      className="rounded-xl! shadow-2xl! min-w-[220px] py-2"
    />
  );

  return (
    <nav className="top-0 z-50 bg-[#1976D2] flex items-center px-8 py-3 gap-2 shadow-lg border-b border-[#0a5232]">
      {/* Back Button */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined className="text-xl" />}
        onClick={() => navigate(-1)}
        className="text-white! border-0! bg-transparent! hover:bg-white/15! transition-all duration-300 rounded-lg"
        size="large"
      />

      {/* Home */}
      <Link to="/dashboard">
        <Button
          type="text"
          icon={<HomeOutlined className="text-lg mr-2" />}
          className="text-white! border-0! bg-transparent! font-semibold text-base tracking-wide hover:bg-white/15! transition-all duration-300 rounded-lg"
          size="large"
        >
          Trang chủ
        </Button>
      </Link>

      {/* System Dropdown */}
      <Dropdown overlay={categoryMenu} placement="bottomLeft">
        <Button
          type="text"
          icon={<AppstoreOutlined className="text-lg mr-2" />}
          className="text-white! border-0! bg-transparent! font-semibold text-base tracking-wide hover:bg-white/15! transition-all duration-300 rounded-lg cursor-pointer group"
          size="large"
        >
          <span>Hệ thống</span>
          <DownOutlined className="text-xs ml-2 group-hover:translate-y-0.5 transition-transform duration-300" />
        </Button>
      </Dropdown>

      {/* Data Input */}
      <Link to="/ware">
        <Button
          type="text"
          icon={<FormOutlined className="text-lg mr-2" />}
          className="text-white! border-0! bg-transparent! font-semibold text-base tracking-wide hover:bg-white/15! transition-all duration-300 rounded-lg"
          size="large"
        >
          Nhập dữ liệu
        </Button>
      </Link>

      {/* Reports Dropdown */}
      <Dropdown overlay={reportsMenu} placement="bottomLeft">
        <Button
          type="text"
          icon={<BarChartOutlined className="text-lg mr-2" />}
          className="text-white! border-0! bg-transparent! font-semibold text-base tracking-wide hover:bg-white/15! transition-all duration-300 rounded-lg cursor-pointer group"
          size="large"
        >
          <span>Báo cáo tác nghiệp</span>
          <DownOutlined className="text-xs ml-2 group-hover:translate-y-0.5 transition-transform duration-300" />
        </Button>
      </Dropdown>

      {/* Account Menu */}
      <div className="ml-auto">
        <Dropdown overlay={accountMenu} placement="bottomRight">
          <Button
            type="text"
            icon={<UserOutlined className="text-xl" />}
            className="text-white! border-0! bg-transparent! hover:bg-white/15! transition-all duration-300 rounded-lg h-10 w-10"
            size="large"
          />
        </Dropdown>
      </div>
    </nav>
  );
}
