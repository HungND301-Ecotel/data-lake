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
  Select,
} from "antd";

import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  SafetyOutlined,
} from "@ant-design/icons";

import type { UserResponse } from "../types/user";
import type { EmployeeRequest, EmployeeResponse } from "../types/employee";

import { employeeApi } from "../api/employeeApi";
import { userApi } from "../../auth/api/userApi";

const ProfilePage: React.FC = () => {
  const [account, setAccount] = useState<UserResponse | null>(null);
  const [profile, setProfile] = useState<EmployeeResponse | null>(null);

  const [loading, setLoading] = useState(true);

  // modal state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const [formPassword] = Form.useForm();
  const [formProfile] = Form.useForm();

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
      const values = await formPassword.validateFields();

      setPasswordLoading(true);

      await userApi.changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });

      message.success("Đổi mật khẩu thành công");

      setPasswordModalOpen(false);
      formPassword.resetFields();
    } catch (err: any) {
      if (err?.errorFields) return;

      message.error(err?.response?.data || "Đổi mật khẩu thất bại");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleOpenProfileModal = () => {
    if (!profile) return;
    formProfile.setFieldsValue({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      birthday: profile.birthday,
      gender: profile.gender,
      address: profile.address,
    });
    setProfileModalOpen(true);
  };

  const handleUpdateProfile = async () => {
    try {
      const values = await formProfile.validateFields();
      setProfileLoading(true);

      const request: EmployeeRequest = {
        id: profile?.id || "",
        name: values.name,
        email: values.email,
        phone: values.phone,
        address: values.address,
        birthday: values.birthday,
        gender: values.gender,
        position: profile?.position || "",
        departmentIds: profile?.departments?.map((d) => d.id) || [],
        avatarFile: null,
      };

      await employeeApi.updateEmployee(request);

      message.success("Cập nhật thông tin cá nhân thành công");
      setProfileModalOpen(false);

      // Re-fetch profile data to refresh UI
      const profileRes = await employeeApi.getMyProfile();
      setProfile(profileRes);
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(
        err?.response?.data || "Cập nhật thông tin cá nhân thất bại",
      );
    } finally {
      setProfileLoading(false);
    }
  };

  if (loading) return <Spin fullscreen />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <Card className="shadow-sm" style={{ marginBottom: "32px" }}>
        <Row align="middle" gutter={16}>
          <Col>
            <Avatar
              size={80}
              src={profile?.keyAvatar || undefined}
              icon={<UserOutlined />}
            />
          </Col>

          <Col flex="auto">
            <div className="text-xl font-semibold">{profile?.name}</div>

            <div className="text-gray-500">{profile?.position}</div>

            <div className="mt-2">
              <Tag color="green">{account?.role}</Tag>

              <Tag color={account?.status ? "green" : "red"}>
                {account?.status ? "Hoạt động" : "Khóa"}
              </Tag>
            </div>
          </Col>

          <Col>
            <Space>
              <Button icon={<EditOutlined />} onClick={handleOpenProfileModal}>
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
          <Card title="Thông tin cá nhân" className="shadow-sm h-full">
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
        <Col span={24} style={{ marginTop: "32px" }}>
          <Card title="Phòng ban được truy cập" className="shadow-sm mt-6">
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
        onCancel={() => {
          setPasswordModalOpen(false);
          formPassword.resetFields();
        }}
        onOk={handleChangePassword}
        confirmLoading={passwordLoading}
        okText="Đổi mật khẩu"
        cancelText="Hủy"
      >
        <Divider />

        <Form layout="vertical" form={formPassword}>
          <Form.Item
            label="Mật khẩu cũ"
            name="oldPassword"
            rules={[{ required: true, message: "Nhập mật khẩu cũ" }]}
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
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject("Mật khẩu không khớp");
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>

      {/* EDIT PROFILE MODAL */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
              <EditOutlined className="text-blue-600 text-lg" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">
                Chỉnh sửa thông tin cá nhân
              </div>
            </div>
          </div>
        }
        open={profileModalOpen}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
        onCancel={() => setProfileModalOpen(false)}
        onOk={handleUpdateProfile}
        confirmLoading={profileLoading}
        okButtonProps={{
          className:
            "bg-green-600! hover:bg-green-700! text-white! border-0 h-10 px-6 text-base font-medium",
          size: "large",
        }}
        cancelButtonProps={{
          size: "large",
          className: "h-10 px-6 text-base",
        }}
      >
        <Form form={formProfile} layout="vertical" className="mt-6">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label={
                <span className="font-medium text-gray-700">Họ và tên</span>
              }
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
            >
              <Input size="large" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="email"
              label={<span className="font-medium text-gray-700">Email</span>}
              rules={[{ required: true, message: "Vui lòng nhập email" }]}
            >
              <Input size="large" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="phone"
              label={
                <span className="font-medium text-gray-700">Số điện thoại</span>
              }
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại" },
              ]}
            >
              <Input size="large" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="birthday"
              label={
                <span className="font-medium text-gray-700">Ngày sinh</span>
              }
            >
              <Input type="date" size="large" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="gender"
              label={
                <span className="font-medium text-gray-700">Giới tính</span>
              }
            >
              <Select size="large" className="rounded-lg">
                <Select.Option value="MALE">Nam</Select.Option>
                <Select.Option value="FEMALE">Nữ</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="address"
              label={<span className="font-medium text-gray-700">Địa chỉ</span>}
            >
              <Input size="large" className="rounded-lg" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
