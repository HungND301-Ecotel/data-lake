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
  
  const dashboardMenu = (
    <Menu
      items={[
        {
          key: "dashboard",
          label: "Dashboard",
          onClick: () => navigate("/dashboard"),
        },
        {
          key: "report-targets",
          label: "Báo cáo thực hiện các chỉ tiêu chủ yếu",
          onClick: () => navigate("/report-targets"),
        },
      ]}
    />
  );
  
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
        {
          key: "employee",
          label: "Nhân viên",
          onClick: () => navigate("/employee"),
        },
      ]}
    />
  );

  const dataEntryMenu = (
    <Menu
      items={[
        {
          key: "ware",
          label: "Nhập dữ liệu",
          onClick: () => navigate("/ware"),
        },
        {
          key: "review",
          label: "Duyệt dữ liệu",
          onClick: () => navigate("/review"),
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

      <Dropdown overlay={dashboardMenu}>
        <Button
          type="text"
          className="text-white! hover:text-white! hover:bg-green-600"
        >
          Trang chủ <DownOutlined />
        </Button>
      </Dropdown>

      <Dropdown overlay={categoryMenu}>
        <Button
          type="text"
          className="text-white! hover:text-white! hover:bg-green-600"
        >
          Hệ thống <DownOutlined />
        </Button>
      </Dropdown>

      <Dropdown overlay={dataEntryMenu}>
        <Button
          type="text"
          className="text-white! hover:text-white! hover:bg-green-600"
        >
          Nhập dữ liệu <DownOutlined />
        </Button>
      </Dropdown>

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