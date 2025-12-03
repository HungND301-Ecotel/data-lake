import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import HeaderBar from "./HeaderBar";
import Sidebar from "./Sidebar";

const { Sider, Content } = Layout;

const MainLayout = () => {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar cố định */}
      <Sider width={200} style={{ position: "fixed", left: 0, top: 0, bottom: 0 }}>
        <Sidebar />
      </Sider>

      <Layout style={{ marginLeft: 200, flexDirection: "column" }}>
        {/* Header cố định */}
        <div style={{ position: "fixed", left: 200, right: 0, top: 0, zIndex: 1 }}>
          <HeaderBar />
        </div>

        {/* Nội dung cuộn */}
        <Content
          style={{
            marginTop: 64, // chiều cao header
            padding: 24,
            overflowY: "auto",
            height: "100vh",
            backgroundColor: "#fff",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
