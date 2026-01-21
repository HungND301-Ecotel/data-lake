import { Link, useNavigate } from "react-router-dom";
import {
  UserOutlined,
  DownOutlined,
  LogoutOutlined,
  ProfileOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Menu } from "antd";

export default function NavBar() {
  const navigate = useNavigate();
  
  const categoryMenu = (
    <Menu
      items={[
        {
          key: "departments",
          label: "Danh mục phòng ban",
          onClick: () => navigate("/category/departments"),
        },
        {
          key: "ware",
          label: "Danh mục báo cáo",
          onClick: () => navigate("/category/ware"),
        },
        {
          key: "employee",
          label: "Danh mục tài khoản",
          onClick: () => navigate("/employee"),
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
    <nav className="top-0 z-50 bg-[#1a8649] flex items-center px-6 py-2 gap-2 shadow-md">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        className="text-white! hover:text-white! hover:bg-green-600"
      ></Button>

      <Link to="/dashboard">
        <Button
          type="text"
          className="text-white! hover:text-white! hover:bg-white"
        >
          Trang chủ
        </Button>
      </Link>

      <Dropdown overlay={categoryMenu}>
        <Button
          type="text"
          className="text-white! hover:text-white! hover:bg-green-600"
        >
          Hệ thống <DownOutlined />
        </Button>
      </Dropdown>

      <Link to="/ware">
        <Button
          type="text"
          className="text-white! hover:text-white! hover:bg-green-600"
        >
          Nhập dữ liệu
        </Button>
      </Link>

      <Link to="/search/master">
        <Button
          type="text"
          className="text-white! hover:text-white! hover:bg-green-600"
        >
          Báo cáo tác nghiệp
        </Button>
      </Link>

      <div className="ml-auto">
        <Dropdown overlay={accountMenu} placement="bottomRight">
          <Button type="text" className="text-white!">
            <UserOutlined />
          </Button>
        </Dropdown>
      </div>
    </nav>
  );
}