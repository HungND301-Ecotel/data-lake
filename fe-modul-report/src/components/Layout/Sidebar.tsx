import { Layout, Menu } from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  FileTextOutlined,
  HomeOutlined,
  OrderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useState } from "react";

const { Sider } = Layout;

const Sidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      theme="dark"
      breakpoint="lg"
      collapsedWidth={80}
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Logo */}
      <div
        style={{
          height: 64,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #333",
          overflow: "hidden",
        }}
      >
        <img
          src="/src/file/logo.png"
          alt="Logo"
          style={{
            height: "80%",
            width: "auto",
            transition: "0.3s",
          }}
        />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ flex: 1, borderRight: 0 }}
        >
          <Menu.Item key="/" icon={<HomeOutlined />}>
            <Link to="/">Trang chủ</Link>
          </Menu.Item>

          <Menu.SubMenu
            key="category"
            icon={<OrderedListOutlined />}
            title="Danh mục"
          >
            <Menu.Item key="/category/employee">
              <Link to="/category/employee">Chức vụ</Link>
            </Menu.Item>

            <Menu.Item key="/category/departments">
              <Link to="/category/departments">Phòng ban</Link>
            </Menu.Item>
          </Menu.SubMenu>


          <Menu.Item key="/employee" icon={<UserOutlined />}>
            <Link to="/employee">Nhân viên</Link>
          </Menu.Item>

          <Menu.SubMenu
            key="reports"
            icon={<FileTextOutlined />}
            title="Báo cáo"
          >
            <Menu.Item key="/reports/template">
              <Link to="/reports/template">Mẫu báo cáo</Link>
            </Menu.Item>

            <Menu.Item key="/reports/storage">
              <Link to="/reports/storage">Kho lưu trữ</Link>
            </Menu.Item>

            <Menu.Item key="/reports/template/list">
              <Link to="/reports/template/list">Modul tạo báo cáo</Link>
            </Menu.Item>
          </Menu.SubMenu>
        </Menu>

        
      </div>
    </Sider>
  );
};

export default Sidebar;
