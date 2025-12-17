import React, { useEffect, useState } from "react";
import { Card, Row, Col, Avatar, Descriptions, Button, Spin } from "antd";
import { UserOutlined, EditOutlined, LockOutlined } from "@ant-design/icons";
import type { UserResponse } from "../../types/user";
import type { EmployeeResponse } from "../../types/employee";
import { userApi } from "../../services/userApi";
import { employeeApi } from "../../services/employeeApi";

const ProfilePage: React.FC = () => {
  const [account, setAccount] = useState<UserResponse | null>(null);
  const [profile, setProfile] = useState<EmployeeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountRes, profileRes] = await Promise.all([
          userApi.getMyAccount(),
          employeeApi.getMyProfile(),
        ]);
        setAccount(accountRes);
        setProfile(profileRes);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spin fullscreen />;

  return (
    <div className="min-h-screen">
      <Row gutter={[0, 24]}>
        {/* ===== THÔNG TIN ĐĂNG NHẬP ===== */}
        <Col span={24}>
          <Card
            title="Thông tin đăng nhập"
            extra={<LockOutlined />}
          >
            <Descriptions column={3} bordered>
              <Descriptions.Item label="Username">
                {account?.username}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                {account?.role}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                {account?.status ? "Hoạt động" : "Khóa"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* ===== THÔNG TIN CÁ NHÂN ===== */}
        <Col span={24}>
          <Card
            title="Thông tin cá nhân"
            extra={<Button icon={<EditOutlined />}>Chỉnh sửa</Button>}
          >
            <Row gutter={16}>
              <Col xs={24} md={4} className="flex justify-center">
                <Avatar
                  size={120}
                  src={profile?.keyAvatar || undefined}
                  icon={<UserOutlined />}
                />
              </Col>

              <Col xs={24} md={20}>
                <Descriptions column={3} bordered>
                  <Descriptions.Item label="Họ và tên">
                    {profile?.name}
                  </Descriptions.Item>
                  <Descriptions.Item label="Giới tính">
                    {profile?.gender}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày sinh">
                    {profile?.birthday}
                  </Descriptions.Item>

                  <Descriptions.Item label="Email">
                    {profile?.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">
                    {profile?.phone}
                  </Descriptions.Item>
                  <Descriptions.Item label="Chức vụ">
                    {profile?.position}
                  </Descriptions.Item>

                  <Descriptions.Item label="Phòng ban">
                    {profile?.departmentName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ" span={2}>
                    {profile?.address}
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage;
