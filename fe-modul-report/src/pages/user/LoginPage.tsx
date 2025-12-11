import { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import { useNavigate } from "react-router-dom";
import { userApi } from "../../services/userApi";

import type { UserLogin, LoginResponse } from "../../types/user";
import { useAuthStore } from "../../stores/authStore";

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setRole = useAuthStore((s) => s.setRole);

  const handleLogin = async (values: UserLogin) => {
    setLoading(true);
    try {
      const res: LoginResponse = await userApi.login(values);
      
      localStorage.setItem("token", res.token);
      localStorage.setItem("refreshToken", res.refreshToken);
      setRole(res.role);
      message.success("Đăng nhập thành công");
      navigate("/"); 
    } catch (err: any) {
      console.log(err);
      message.error(err?.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f0f2f5",
      }}
    >
      <Card title="Đăng nhập" style={{ width: 350 }}>
        <Form
          layout="vertical"
          onFinish={handleLogin}
          initialValues={{ username: "", password: "" }}
        >
          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[{ required: true, message: "Vui lòng nhập username" }]}
          >
            <Input placeholder="Username" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập password" }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
