import { Table, Tag, Card, Button, Empty } from "antd";
import {
  ReloadOutlined,
  FileExcelOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { DataSource } from "../types/datalake";

interface SourcesListProps {
  sources: DataSource[];
  loading: boolean;
  onRefresh: () => void;
}

const SourcesList: React.FC<SourcesListProps> = ({
  sources,
  loading,
  onRefresh,
}) => {
  const columns: ColumnsType<DataSource> = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 150,
      render: (type: string) => {
        const isExcel = type === "excel";
        return (
          <Tag
            icon={isExcel ? <FileExcelOutlined /> : <DatabaseOutlined />}
            color={isExcel ? "black" : "blue"}
          >
            {isExcel ? "Excel" : "SQL Backup"}
          </Tag>
        );
      },
    },
    {
      title: "Kích thước",
      dataIndex: "size_bytes",
      key: "size_bytes",
      width: 120,
      render: (bytes: number | undefined) => {
        if (!bytes) return "N/A";
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (date: string | undefined) =>
        date ? new Date(date).toLocaleString("vi-VN") : "N/A",
    },
  ];

  return (
    <Card
      title="Danh sách nguồn dữ liệu"
      extra={
        <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
          Làm mới
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={sources}
        rowKey="name"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 600 }}
        locale={{
          emptyText: (
            <Empty description="Chưa có nguồn dữ liệu. Hãy tải lên file để bắt đầu." />
          ),
        }}
      />
    </Card>
  );
};

export default SourcesList;
