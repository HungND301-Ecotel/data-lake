import { Layout, Avatar, Badge, Dropdown } from "antd";
import type { MenuProps } from "antd";

import {
  BellOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Header } = Layout;

const HeaderBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  let title: string;

  if (location.pathname === "/") title = "Trang chủ";
  else if (location.pathname === "/reports/template") title = "Mẫu báo cáo";
  else if (location.pathname === "/reports/storage") title = "Kho lưu trữ";
  else if (location.pathname.startsWith("/reports/")) title = "Chi tiết báo cáo";
  else title = "";

  // MENU DROPDOWN
  const items: MenuProps["items"] = [
    {
      key: "profile",
      label: "Thông tin cá nhân",
      icon: <UserOutlined />,
      onClick: () => navigate("/profile"),
    },
    {
      key: "logout",
      label: "Đăng xuất",
      danger: true,
      icon: <LogoutOutlined />,
      onClick: () => {
        // Xóa token và refreshToken
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
    
        // Chuyển hướng về trang login
        navigate("/login");
      },
    }
    
  ];

  return (
    <Header
      style={{
        background: "#fff",
        padding: "0 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
      }}
    >
      {/* LEFT */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <ArrowLeftOutlined
          onClick={() => navigate(-1)}
          style={{ fontSize: 23, cursor: "pointer" }}
        />

        <h3
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            paddingLeft: 4, // tạo khoảng cách nhẹ
          }}
        >
          {title}
        </h3>
      </div>

      {/* RIGHT */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <Badge count={3}>
          <BellOutlined style={{ fontSize: 20 }} />
        </Badge>

        {/* Dropdown avatar: CLICK TO OPEN */}
        <Dropdown menu={{ items }} trigger={["click"]}>
          <Avatar
            src="https://i.pravatar.cc/150"
            style={{ cursor: "pointer" }}
          />
        </Dropdown>
      </div>
    </Header>
  );
};

export default HeaderBar;
