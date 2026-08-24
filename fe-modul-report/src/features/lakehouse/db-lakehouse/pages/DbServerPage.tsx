import { useState } from "react";
import {
  Card, Table, Button, Alert, Modal, Form, Input, InputNumber, Switch,
  Space, Tag, Popconfirm, Typography, message, List, Badge,
} from "antd";
import {
  PlusOutlined, ReloadOutlined, DeleteOutlined, EditOutlined,
  ApiOutlined, StarOutlined, StarFilled, CloudServerOutlined,
} from "@ant-design/icons";
import { useServer } from "../hooks/useServer";
import type { ServerConfig, ServerCreateRequest, ServerUpdateRequest, ServerTestResponse } from "../types/dbLakehouse";

const { Title, Text } = Typography;

export default function DbServerPage() {
  const {
    servers, loading, saving, testing, error,
    fetchServers, createServer, updateServer, deleteServer, testConnection, setDefault,
  } = useServer();

  const [formVisible, setFormVisible] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerConfig | null>(null);
  const [testResult, setTestResult] = useState<{ serverId: string; result: ServerTestResponse } | null>(null);
  const [form] = Form.useForm();

  const handleCreate = async (values: ServerCreateRequest) => {
    const result = await createServer(values);
    if (result.success) {
      message.success("Đã thêm server!");
      setFormVisible(false);
      form.resetFields();
    }
  };

  const handleUpdate = async (values: ServerUpdateRequest) => {
    if (!editingServer) return;
    const result = await updateServer(editingServer.id, values);
    if (result.success) {
      message.success("Đã cập nhật server!");
      setEditingServer(null);
      setFormVisible(false);
      form.resetFields();
    }
  };

  const handleDelete = async (serverId: string) => {
    const result = await deleteServer(serverId);
    if (result.success) message.success("Đã xoá server!");
  };

  const handleTest = async (serverId: string) => {
    const result = await testConnection(serverId);
    if (result.success && result.data) {
      setTestResult({ serverId, result: result.data });
      if (result.data.success) {
        message.success(result.data.message);
      } else {
        message.error(result.data.message);
      }
    }
  };

  const handleSetDefault = async (serverId: string) => {
    const result = await setDefault(serverId);
    if (result.success) message.success("Đã đặt server mặc định!");
  };

  const openEdit = (server: ServerConfig) => {
    setEditingServer(server);
    form.setFieldsValue(server);
    setFormVisible(true);
  };

  const openCreate = () => {
    setEditingServer(null);
    form.resetFields();
    form.setFieldsValue({ port: 1433, trust_cert: true, windows_auth: false, username: "sa" });
    setFormVisible(true);
  };

  const columns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: ServerConfig) => (
        <Space>
          {record.is_default ? <StarFilled className="text-yellow-500" /> : <StarOutlined className="text-gray-300" />}
          <Text strong>{name}</Text>
          {record.is_default && <Tag color="green">Default</Tag>}
        </Space>
      ),
    },
    {
      title: "Host",
      dataIndex: "host",
      key: "host",
      render: (host: string, record: ServerConfig) => `${host}:${record.port}`,
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      width: 100,
    },
    {
      title: "Auth",
      key: "auth",
      width: 120,
      render: (_: unknown, record: ServerConfig) =>
        record.windows_auth ? <Tag>Windows</Tag> : <Tag color="green">SQL Auth</Tag>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (v: string) => v ? new Date(v).toLocaleString("vi-VN") : "-",
    },
    {
      title: "",
      key: "actions",
      width: 200,
      render: (_: unknown, record: ServerConfig) => (
        <Space>
          <Button size="small" icon={<ApiOutlined />} onClick={() => handleTest(record.id)} loading={testing}>
            Test
          </Button>
          {!record.is_default && (
            <Button size="small" icon={<StarOutlined />} onClick={() => handleSetDefault(record.id)}>
              Default
            </Button>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Xoá server này?" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" closable />}

      <Card
        title={
          <Title level={5} className="mb-0">
            <CloudServerOutlined className="mr-2" />
            Quản lý SQL Server
          </Title>
        }
        extra={
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={openCreate}>
              Thêm Server
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchServers} loading={loading}>
              Làm mới
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={servers}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={false}
        />
      </Card>

      {/* Test connection result */}
      {testResult && (
        <Card size="small" title={
          <Space>
            <Badge status={testResult.result.success ? "success" : "error"} />
            <Text>Kết quả kiểm tra kết nối</Text>
          </Space>
        }>
          <Text className={testResult.result.success ? "text-green-600" : "text-red-500"}>
            {testResult.result.message}
          </Text>
          {testResult.result.databases.length > 0 && (
            <div className="mt-2">
              <Text type="secondary">Database có sẵn ({testResult.result.databases.length}):</Text>
              <List
                size="small"
                dataSource={testResult.result.databases}
                renderItem={(db) => <List.Item className="py-1!">{db}</List.Item>}
                className="mt-1"
              />
            </div>
          )}
        </Card>
      )}

      {/* Create/Edit modal */}
      <Modal
        title={editingServer ? `Sửa: ${editingServer.name}` : "Thêm SQL Server mới"}
        open={formVisible}
        onCancel={() => { setFormVisible(false); setEditingServer(null); form.resetFields(); }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingServer ? handleUpdate : handleCreate}
        >
          <Form.Item name="name" label="Tên hiển thị" rules={[{ required: true, message: "Nhập tên server" }]}>
            <Input placeholder="VD: Server Kế toán" />
          </Form.Item>

          <div className="grid grid-cols-3 gap-3">
            <Form.Item name="host" label="Host" rules={[{ required: true, message: "Nhập host" }]} className="col-span-2">
              <Input placeholder="VD: 192.168.1.100 hoặc localhost\SQLEXPRESS" />
            </Form.Item>
            <Form.Item name="port" label="Port">
              <InputNumber min={1} max={65535} className="w-full" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item name="username" label="Username">
              <Input placeholder="sa" />
            </Form.Item>
            <Form.Item
              name="password"
              label="Password"
              rules={editingServer ? [] : [{ required: true, message: "Nhập password" }]}
            >
              <Input.Password placeholder={editingServer ? "Để trống nếu không đổi" : "Nhập password"} />
            </Form.Item>
          </div>

          <div className="flex gap-6 mb-4">
            <Form.Item name="trust_cert" valuePropName="checked" className="mb-0">
              <Switch checkedChildren="Trust Cert" unCheckedChildren="No Trust" />
            </Form.Item>
            <Form.Item name="windows_auth" valuePropName="checked" className="mb-0">
              <Switch checkedChildren="Windows Auth" unCheckedChildren="SQL Auth" />
            </Form.Item>
          </div>

          <Button type="primary" htmlType="submit" loading={saving} block size="large">
            {editingServer ? "Cập nhật" : "Thêm Server"}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
