import { useState } from "react";
import { Table, Typography, Tag, Card, Button, Tooltip, message } from "antd";
import {
  DatabaseOutlined,
  CopyOutlined,
  ExpandOutlined,
  CompressOutlined,
} from "@ant-design/icons";
import type { DbQueryResult } from "../types/chat";
import type { ColumnsType } from "antd/es/table";

const { Text, Paragraph } = Typography;

interface DbQueryTableProps {
  dbQuery: DbQueryResult;
}

const DbQueryTable: React.FC<DbQueryTableProps> = ({ dbQuery }) => {
  const [expanded, setExpanded] = useState(false);
  const [showAllColumns, setShowAllColumns] = useState(false);

  const handleCopyQuery = async () => {
    await navigator.clipboard.writeText(dbQuery.generated_query);
    message.success("Đã sao chép câu lệnh SQL");
  };

  // Limit columns shown initially (show first 8 columns)
  const displayColumns = showAllColumns
    ? dbQuery.columns
    : dbQuery.columns.slice(0, 8);

  const columns: ColumnsType<Record<string, string | number | null>> =
    displayColumns.map((col) => ({
      title: (
        <Tooltip title={col}>
          <span className="text-xs">{col.length > 15 ? col.slice(0, 15) + "..." : col}</span>
        </Tooltip>
      ),
      dataIndex: col,
      key: col,
      width: 120,
      ellipsis: true,
      render: (value: string | number | null) => {
        if (value === null || value === "") {
          return <Text type="secondary" italic>null</Text>;
        }
        if (typeof value === "number") {
          return <Text>{value.toLocaleString()}</Text>;
        }
        return (
          <Tooltip title={String(value)}>
            <Text className="text-xs">
              {String(value).length > 20
                ? String(value).slice(0, 20) + "..."
                : value}
            </Text>
          </Tooltip>
        );
      },
    }));

  // Add row number column
  columns.unshift({
    title: "#",
    key: "_index",
    width: 50,
    fixed: "left",
    render: (_: unknown, __: unknown, index: number) => (
      <Text type="secondary">{index + 1}</Text>
    ),
  });

  const dataSource = dbQuery.rows.map((row, index) => ({
    ...row,
    _key: index,
  }));

  const displayedRows = expanded ? dataSource : dataSource.slice(0, 5);

  return (
    <Card
      size="small"
      className="mt-3"
      title={
        <div className="flex items-center gap-2">
          <DatabaseOutlined className="text-blue-500" />
          <Text strong className="text-sm">Kết quả truy vấn SQL</Text>
          <Tag color="green">{dbQuery.source}</Tag>
          <Tag color="green">{dbQuery.total_rows} dòng</Tag>
        </div>
      }
      extra={
        <div className="flex gap-1">
          {dbQuery.columns.length > 8 && (
            <Button
              size="small"
              type="text"
              onClick={() => setShowAllColumns(!showAllColumns)}
            >
              {showAllColumns
                ? `Ẩn bớt (${dbQuery.columns.length - 8} cột)`
                : `Xem tất cả ${dbQuery.columns.length} cột`}
            </Button>
          )}
          <Tooltip title="Sao chép SQL">
            <Button
              size="small"
              type="text"
              icon={<CopyOutlined />}
              onClick={handleCopyQuery}
            />
          </Tooltip>
          {dataSource.length > 5 && (
            <Tooltip title={expanded ? "Thu gọn" : "Mở rộng"}>
              <Button
                size="small"
                type="text"
                icon={expanded ? <CompressOutlined /> : <ExpandOutlined />}
                onClick={() => setExpanded(!expanded)}
              />
            </Tooltip>
          )}
        </div>
      }
    >
      {/* SQL Query */}
      <div className="mb-3 p-2 bg-gray-50 rounded border">
        <Text type="secondary" className="text-xs block mb-1">
          Câu lệnh SQL:
        </Text>
        <Paragraph
          code
          className="!mb-0 text-xs"
          copyable={{ text: dbQuery.generated_query }}
        >
          {dbQuery.generated_query}
        </Paragraph>
      </div>

      {/* Error message if any */}
      {dbQuery.error && (
        <div className="mb-3 p-2 bg-red-50 rounded border border-red-200">
          <Text type="danger" className="text-xs">
            Lỗi: {dbQuery.error}
          </Text>
        </div>
      )}

      {/* Data Table */}
      <Table
        columns={columns}
        dataSource={displayedRows}
        rowKey="_key"
        size="small"
        pagination={false}
        scroll={{ x: "max-content" }}
        bordered
        className="text-xs"
      />

      {/* Footer info */}
      <div className="mt-2 flex items-center justify-between text-xs">
        <Text type="secondary">
          Hiển thị {displayedRows.length} / {dbQuery.total_rows} dòng
          {!showAllColumns && dbQuery.columns.length > 8 && (
            <span> • {displayColumns.length} / {dbQuery.columns.length} cột</span>
          )}
        </Text>
        {!expanded && dataSource.length > 5 && (
          <Button type="link" size="small" onClick={() => setExpanded(true)}>
            Xem thêm {dataSource.length - 5} dòng
          </Button>
        )}
      </div>
    </Card>
  );
};

export default DbQueryTable;
