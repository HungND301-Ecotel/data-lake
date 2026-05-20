import { Table, Tag, Button, Popconfirm, Space, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined, StarOutlined, StarFilled } from "@ant-design/icons";
import type { ServerConfig, TestConnectionResult } from "../types/server";
import TestConnectionButton from "./TestConnectionButton";

interface Props {
  servers: ServerConfig[];
  loading: boolean;
  onEdit: (server: ServerConfig) => void;
  onDelete: (serverId: string) => void;
  onSetDefault: (serverId: string) => void;
  onTest: (serverId: string) => Promise<TestConnectionResult>;
}

export default function ServerTable({ servers, loading, onEdit, onDelete, onSetDefault, onTest }: Props) {
  const columns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: ServerConfig) => (
        <span className="font-medium">
          {name}
          {record.is_default && <Tag color="green" className="ml-2">Mặc định</Tag>}
        </span>
      ),
    },
    {
      title: "Host",
      key: "host",
      render: (_: unknown, record: ServerConfig) => (
        <span className="font-mono text-sm">{record.host}:{record.port}</span>
      ),
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Driver",
      dataIndex: "driver",
      key: "driver",
      render: (driver: string) => (
        <Tag>{driver.replace(/[{}]/g, "")}</Tag>
      ),
    },
    {
      title: "Auth",
      key: "auth",
      render: (_: unknown, record: ServerConfig) => (
        <Tag color={record.windows_auth ? "blue" : "default"}>
          {record.windows_auth ? "Windows" : "SQL"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 280,
      render: (_: unknown, record: ServerConfig) => (
        <Space size="small">
          <TestConnectionButton serverId={record.id} onTest={onTest} />
          {!record.is_default && (
            <Tooltip title="Đặt làm mặc định">
              <Button size="small" icon={<StarOutlined />} onClick={() => onSetDefault(record.id)} />
            </Tooltip>
          )}
          {record.is_default && (
            <Tooltip title="Server mặc định">
              <Button size="small" icon={<StarFilled className="text-yellow-500" />} disabled />
            </Tooltip>
          )}
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)}>Sửa</Button>
          <Popconfirm
            title="Xoá server này?"
            description="Hành động không thể hoàn tác"
            onConfirm={() => onDelete(record.id)}
            okText="Xoá"
            cancelText="Huỷ"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>Xoá</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={servers}
      rowKey="id"
      loading={loading}
      pagination={false}
      size="middle"
      scroll={{ x: 800 }}
    />
  );
}
