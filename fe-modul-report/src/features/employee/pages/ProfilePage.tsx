import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Avatar,
  Descriptions,
  Button,
  Spin,
  Modal,
  Form,
  Input,
  Tag,
  message,
  Space,
  Divider,
} from "antd";

import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  SafetyOutlined,
} from "@ant-design/icons";

import type { UserResponse } from "../types/user";
import type { EmployeeResponse } from "../types/employee";

import { employeeApi } from "../api/employeeApi";
import { userApi } from "../../auth/api/userApi";

const ProfilePage: React.FC = () => {
  const [account, setAccount] = useState<UserResponse | null>(null);
  const [profile, setProfile] = useState<EmployeeResponse | null>(null);

  const [loading, setLoading] = useState(true);

  // modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountRes, profileRes] = await Promise.all([
          userApi.getMyAccount(),
          employeeApi.getMyProfile(),
        ]);

        setAccount(accountRes);
        setProfile(profileRes);
      } catch {
        message.error("Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChangePassword = async () => {
    try {
      const values = await form.validateFields();

      setPasswordLoading(true);

      await userApi.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      message.success("Đổi mật khẩu thành công");

      setPasswordModalOpen(false);
      form.resetFields();
    } catch (err: any) {
      if (err?.errorFields) return;

      message.error(err?.response?.data || "Đổi mật khẩu thất bại");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) return <Spin fullscreen />;

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <Card className="mb-6 shadow-sm">
        <Row align="middle" gutter={16}>
          <Col>
            <Avatar
              size={80}
              src={profile?.keyAvatar || undefined}
              icon={<UserOutlined />}
            />
          </Col>

          <Col flex="auto">
            <div className="text-xl font-semibold">
              {profile?.name}
            </div>

            <div className="text-gray-500">
              {profile?.position}
            </div>

            <div className="mt-2">
              <Tag color="blue">{account?.role}</Tag>

              <Tag color={account?.status ? "green" : "red"}>
                {account?.status ? "Hoạt động" : "Khóa"}
              </Tag>
            </div>
          </Col>

          <Col>
            <Space>
              <Button icon={<EditOutlined />}>
                Chỉnh sửa
              </Button>

              <Button
                icon={<SafetyOutlined />}
                type="primary"
                onClick={() => setPasswordModalOpen(true)}
              >
                Đổi mật khẩu
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={24}>

        {/* LOGIN INFO */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <LockOutlined />
                Thông tin đăng nhập
              </Space>
            }
            className="shadow-sm h-full"
          >
            <Descriptions column={1} bordered size="middle">

              <Descriptions.Item label="Username">
                {account?.username}
              </Descriptions.Item>

              <Descriptions.Item label="Role">
                {account?.role}
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái">
                <Tag color={account?.status ? "green" : "red"}>
                  {account?.status ? "Hoạt động" : "Khóa"}
                </Tag>
              </Descriptions.Item>

            </Descriptions>
          </Card>
        </Col>

        {/* PERSONAL INFO */}
        <Col xs={24} lg={12}>
          <Card
            title="Thông tin cá nhân"
            className="shadow-sm h-full"
          >
            <Descriptions column={1} bordered size="middle">

              <Descriptions.Item label="Email">
                {profile?.email}
              </Descriptions.Item>

              <Descriptions.Item label="Số điện thoại">
                {profile?.phone}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày sinh">
                {profile?.birthday}
              </Descriptions.Item>

              <Descriptions.Item label="Giới tính">
                {profile?.gender || "Chưa cập nhật"}
              </Descriptions.Item>

              <Descriptions.Item label="Địa chỉ">
                {profile?.address}
              </Descriptions.Item>

            </Descriptions>
          </Card>
        </Col>

        {/* DEPARTMENTS */}
        <Col span={24}>
          <Card
            title="Phòng ban được truy cập"
            className="shadow-sm mt-6"
          >
            {profile?.departments?.length ? (
              <Space wrap>

                {profile.departments.map((dept) => (
                  <Tag
                    key={dept.id}
                    color="processing"
                    className="px-3 py-1 text-sm"
                  >
                    {dept.name}
                  </Tag>
                ))}

              </Space>
            ) : (
              "Không có phòng ban"
            )}
          </Card>
        </Col>

      </Row>

      {/* CHANGE PASSWORD MODAL */}

      <Modal
        title="Đổi mật khẩu"
        open={passwordModalOpen}
        onCancel={() => setPasswordModalOpen(false)}
        onOk={handleChangePassword}
        confirmLoading={passwordLoading}
        okText="Đổi mật khẩu"
        cancelText="Hủy"
      >
        <Divider />

        <Form layout="vertical" form={form}>

          <Form.Item
            label="Mật khẩu cũ"
            name="oldPassword"
            rules={[
              { required: true, message: "Nhập mật khẩu cũ" },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[
              { required: true, message: "Nhập mật khẩu mới" },
              { min: 6, message: "Tối thiểu 6 ký tự" },
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Xác nhận mật khẩu" },

              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (
                    !value ||
                    getFieldValue("newPassword") === value
                  ) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    "Mật khẩu không khớp"
                  );
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

        </Form>

      </Modal>

    </div>
  );
};

export default ProfilePage;