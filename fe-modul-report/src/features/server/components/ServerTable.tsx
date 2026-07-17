import { Table, Tag, Button, Popconfirm, Space } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { SyncConnectionConfig } from "../types/server";

const DB_TYPE_LABEL: Record<string, string> = {
  SQLSERVER: "SQL Server",
  POSTGRESQL: "PostgreSQL",
  MYSQL: "MySQL",
  ORACLE: "Oracle",
};

interface Props {
  servers: SyncConnectionConfig[];
  loading: boolean;
  onEdit: (server: SyncConnectionConfig) => void;
  onDelete: (id: string) => void;
}

export default function ServerTable({ servers, loading, onEdit, onDelete }: Props) {
  const columns = [
    {
      title: "Host : Port",
      key: "host",
      render: (_: unknown, record: SyncConnectionConfig) => (
        <span className="font-mono text-sm">
          {record.host}:{record.port}
        </span>
      ),
    },
    {
      title: "Database",
      dataIndex: "databaseName",
      key: "databaseName",
      render: (name: string) => <span className="font-medium">{name}</span>,
    },
    {
      title: "Loại DB",
      dataIndex: "databaseType",
      key: "databaseType",
      render: (type: string) => (
        <Tag>
          {DB_TYPE_LABEL[type] ?? type}
        </Tag>
      ),
    },
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Trạng thái",
      dataIndex: "active",
      key: "active",
      render: (active: boolean) => (
        <Tag color={active === false ? "red" : "success"}>
          {active === false ? "Tắt" : "Hoạt động"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 140,
      render: (_: unknown, record: SyncConnectionConfig) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xoá kết nối này?"
            description="Hành động không thể hoàn tác"
            onConfirm={() => onDelete(record.id)}
            okText="Xoá"
            cancelText="Huỷ"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Xoá
            </Button>
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
      scroll={{ x: 700 }}
    />
  );
}
