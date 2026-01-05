import { Layout, Menu } from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  DiffOutlined,
  FileTextOutlined,
  HomeOutlined,
  OrderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
//import { useAuthStore } from "../../stores/authStore";

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const location = useLocation();

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      theme="dark"
      width={200}
      collapsedWidth={80}
      style={{ minHeight: "100vh" }}
    >
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "1px solid #333",
        }}
      >
        <img
          src="/src/file/logo.png"
          alt="Logo"
          style={{ height: "80%" }}
        />
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
      >
        <Menu.Item key="/" icon={<HomeOutlined />}>
          <Link to="/">Trang chủ</Link>
        </Menu.Item>

        <Menu.SubMenu
          key="category"
          icon={<OrderedListOutlined />}
          title="Danh mục"
        >
          <Menu.Item key="/category/departments">
            <Link to="/category/departments">Phòng ban</Link>
          </Menu.Item>
          <Menu.Item key="/category/report">
            <Link to="/category/report">Danh mục báo cáo</Link>
          </Menu.Item>
          <Menu.Item key="/category/ware">
            <Link to="/category/ware">Danh mục DTL</Link>
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
        </Menu.SubMenu>

        <Menu.SubMenu
          key="wares"
          icon={<DiffOutlined />}
          title="QL dữ liệu"
        >
          <Menu.Item key="/ware">
            <Link to="/ware">Đẩy dữ liệu</Link>
          </Menu.Item>

        </Menu.SubMenu>

      </Menu>
    </Sider>
  );
};

export default Sidebar;
