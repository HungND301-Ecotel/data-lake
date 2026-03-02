import { useState, useEffect } from "react";
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
  RobotOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  HddOutlined,
  SearchOutlined,
  ScheduleOutlined,
  CloudUploadOutlined,
  GoldOutlined,
  TableOutlined,
  FileSearchOutlined,
  CodeOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Menu } from "antd";
import { employeeApi } from "../employee/api/employeeApi";

export default function NavBar() {
  const [userName, setUserName] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await employeeApi.getMyProfile();
        setUserName(profile.name);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const categoryMenu = (
    <Menu
      items={[
        {
          key: "departments",
          icon: <TeamOutlined className="text-lg" />,
          label: <span className="text-base font-medium">Danh mục phòng ban</span>,
          onClick: () => navigate("/category/departments"),
          className: "py-3 px-4 hover:bg-[#f0f9f4]!",
        },
        {
          key: "ware",
          icon: <FileTextOutlined className="text-lg" />,
          label: <span className="text-base font-medium">Danh mục báo cáo</span>,
          onClick: () => navigate("/category/ware"),
          className: "py-3 px-4 hover:bg-[#f0f9f4]!",
        },
        {
          key: "employee",
          icon: <IdcardOutlined className="text-lg" />,
          label: <span className="text-base font-medium">Danh mục tài khoản</span>,
          onClick: () => navigate("/employee"),
          className: "py-3 px-4 hover:bg-[#f0f9f4]!",
        },
        {
          key: "accountConfig",
          icon: <IdcardOutlined className="text-lg" />,
          label: <span className="text-base font-medium">Cấu hình tài khoản TKV</span>,
          onClick: () => navigate("/account-config"),
          className: "py-3 px-4 hover:bg-[#f0f9f4]!",
        },
      ]}
      className="rounded-xl! shadow-2xl! min-w-[260px] py-2"
    />
  );

  const datalakeMenu = (
    <Menu
      items={[
        {
          key: "ai-group",
          type: "group" as const,
          label: <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI & Chat</span>,
          children: [
            {
              key: "ai-chat",
              icon: <RobotOutlined className="text-lg" />,
              label: <span className="text-base font-medium">Chat AI</span>,
              onClick: () => navigate("/ai-chat"),
              className: "py-2 px-4 hover:bg-[#f0f9f4]!",
            },
            {
              key: "table-qa",
              icon: <TableOutlined className="text-lg" />,
              label: <span className="text-base font-medium">Table QA</span>,
              onClick: () => navigate("/lakehouse/table-qa"),
              className: "py-2 px-4 hover:bg-[#f0f9f4]!",
            },
            {
              key: "document-chat",
              icon: <FileSearchOutlined className="text-lg" />,
              label: <span className="text-base font-medium">Document Chat</span>,
              onClick: () => navigate("/lakehouse/document-chat"),
              className: "py-2 px-4 hover:bg-[#f0f9f4]!",
            },
          ],
        },
        { type: "divider" as const, className: "my-1" },
        {
          key: "pipeline-group",
          type: "group" as const,
          label: <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Data Pipeline</span>,
          children: [
            {
              key: "pipeline",
              icon: <CloudUploadOutlined className="text-lg" />,
              label: <span className="text-base font-medium">Pipeline</span>,
              onClick: () => navigate("/lakehouse/pipeline"),
              className: "py-2 px-4 hover:bg-[#f0f9f4]!",
            },
            {
              key: "gold",
              icon: <GoldOutlined className="text-lg" />,
              label: <span className="text-base font-medium">Gold Extraction</span>,
              onClick: () => navigate("/lakehouse/gold"),
              className: "py-2 px-4 hover:bg-[#f0f9f4]!",
            },
          ],
        },
        { type: "divider" as const, className: "my-1" },
        {
          key: "data-group",
          type: "group" as const,
          label: <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Quản lý dữ liệu</span>,
          children: [
            {
              key: "datalake-data",
              icon: <DatabaseOutlined className="text-lg" />,
              label: <span className="text-base font-medium">Quản lý dữ liệu</span>,
              onClick: () => navigate("/datalake/data"),
              className: "py-2 px-4 hover:bg-[#f0f9f4]!",
            },
            {
              key: "datalake-sync",
              icon: <SyncOutlined className="text-lg" />,
              label: <span className="text-base font-medium">Đồng bộ dữ liệu</span>,
              onClick: () => navigate("/datalake/sync"),
              className: "py-2 px-4 hover:bg-[#f0f9f4]!",
            },
            {
              key: "datalake-status",
              icon: <CloudServerOutlined className="text-lg" />,
              label: <span className="text-base font-medium">Trạng thái hệ thống</span>,
              onClick: () => navigate("/datalake/status"),
              className: "py-2 px-4 hover:bg-[#f0f9f4]!",
            },
          ],
        },
        { type: "divider" as const, className: "my-1" },
        {
          key: "tools-group",
          type: "group" as const,
          label: <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Công cụ</span>,
          children: [
            {
              key: "servers",
              icon: <HddOutlined className="text-lg" />,
              label: <span className="text-base font-medium">Quản lý Server</span>,
              onClick: () => navigate("/servers"),
              className: "py-2 px-4 hover:bg-[#f0f9f4]!",
            },
            {
              key: "database",
              icon: <SearchOutlined className="text-lg" />,
              label: <span className="text-base font-medium">Database Explorer</span>,
              onClick: () => navigate("/database"),
              className: "py-2 px-4 hover:bg-[#f0f9f4]!",
            },
            {
              key: "jobs",
              icon: <ScheduleOutlined className="text-lg" />,
              label: <span className="text-base font-medium">Job Tracking</span>,
              onClick: () => navigate("/jobs"),
              className: "py-2 px-4 hover:bg-[#f0f9f4]!",
            },
            {
              key: "sql-metadata",
              icon: <CodeOutlined className="text-lg" />,
              label: <span className="text-base font-medium">SQL Metadata</span>,
              onClick: () => navigate("/sql-metadata"),
              className: "py-2 px-4 hover:bg-[#f0f9f4]!",
            },
            {
              key: "excel-mapping",
              icon: <FileExcelOutlined className="text-lg" />,
              label: <span className="text-base font-medium">Excel Mapping</span>,
              onClick: () => navigate("/excel-mapping"),
              className: "py-2 px-4 hover:bg-[#f0f9f4]!",
            },
          ],
        },
      ]}
      className="rounded-xl! shadow-2xl! min-w-[280px] py-2 max-h-[80vh] overflow-y-auto"
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
    <nav className="top-0 z-50 bg-[#39b6f9]! flex items-center px-8 py-3 gap-2 shadow-lg border-b border-white">
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

      {/* Data Lake Dropdown */}
      <Dropdown overlay={datalakeMenu} placement="bottomLeft">
        <Button
          type="text"
          icon={<DatabaseOutlined className="text-lg mr-2" />}
          className="text-white! border-0! bg-transparent! font-semibold text-base tracking-wide hover:bg-white/15! transition-all duration-300 rounded-lg cursor-pointer group"
          size="large"
        >
          <span>Data Lake</span>
          <DownOutlined className="text-xs ml-2 group-hover:translate-y-0.5 transition-transform duration-300" />
        </Button>
      </Dropdown>

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
            className="text-white! border-0! bg-transparent! hover:bg-white/15! transition-all duration-300 rounded-lg"
            size="large"
          >
            {userName && (
              <span className="text-sm font-semibold ml-1">{userName}</span>
            )}
          </Button>
        </Dropdown>
      </div>
    </nav>
  );
}