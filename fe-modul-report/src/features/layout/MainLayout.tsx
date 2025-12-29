import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import HeaderBar from "./HeaderBar";
import Sidebar from "./Sidebar";
import { useState } from "react";

const { Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

      <Layout style={{ minWidth: 0, overflow: "hidden" }}>
        <HeaderBar />

        <Content
          style={{
            height: "calc(100vh - 64px)",
            overflow: "auto",
            background: "#f5f5f5",
          }}
        >
          <div
            style={{
              padding: 24,
              minHeight: "100%",
              background: "#fff",
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
