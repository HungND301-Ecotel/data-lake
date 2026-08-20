import { Table, Tag, Button, Space, Tooltip } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import type { DatabaseMeta } from "../types/dbLakehouse";
import type { DbLayerType } from "../hooks/useDbPipeline";

interface DatabaseListProps {
  databases: DatabaseMeta[];
  loading: boolean;
  onView: (dbName: string) => void;
}

const layerColors: Record<DbLayerType, string> = {
  bronze: "orange",
  silver: "blue",
  gold: "gold",
};

export default function DatabaseList({ databases, loading, onView }: DatabaseListProps) {
  const columns = [
    {
      title: "Database",
      dataIndex: "database",
      key: "database",
      render: (name: string) => <span className="font-medium">{name}</span>,
    },
    {
      title: "Layer",
      dataIndex: "layer",
      key: "layer",
      width: 100,
      render: (layer: string) => (
        <Tag color={layerColors[layer as DbLayerType] || "default"}>
          {layer.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Bảng",
      dataIndex: "tables",
      key: "tables",
      render: (tables: string[]) => tables?.length || 0,
      width: 80,
    },
    {
      title: "Tổng dòng",
      dataIndex: "total_rows",
      key: "total_rows",
      render: (rows: number) => rows?.toLocaleString() || "-",
      width: 120,
    },
    {
      title: "Thời gian",
      key: "time",
      width: 180,
      render: (_: unknown, record: DatabaseMeta) => {
        const time = record.imported_at || record.transformed_at;
        return time ? new Date(time).toLocaleString("vi-VN") : "-";
      },
    },
    {
      title: "",
      key: "actions",
      width: 80,
      render: (_: unknown, record: DatabaseMeta) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => onView(record.database)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={databases}
      columns={columns}
      rowKey="database"
      loading={loading}
      size="small"
      pagination={{ pageSize: 10 }}
    />
  );
}
