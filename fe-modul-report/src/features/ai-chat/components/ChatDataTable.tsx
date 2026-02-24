import { Table, Typography } from "antd";
import type { ChatTableData } from "../types/chat";

const { Text } = Typography;

interface ChatDataTableProps {
  data: ChatTableData;
}

const ChatDataTable: React.FC<ChatDataTableProps> = ({ data }) => {
  const columns = data.columns.map((col) => ({
    title: col,
    dataIndex: col,
    key: col,
    ellipsis: true,
    render: (value: string | number) =>
      typeof value === "number" ? value.toLocaleString() : value,
  }));

  const dataSource = data.rows.slice(0, 5).map((row, index) => ({
    ...row,
    _key: index,
  }));

  const hasMore = data.rows.length > 5;

  return (
    <div className="mt-3">
      {data.source && (
        <div className="flex items-center justify-between mb-2">
          <Text type="secondary" className="text-xs">
            Bảng: {data.source}
          </Text>
          <Text type="secondary" className="text-xs">
            {data.rows.length} dòng
          </Text>
        </div>
      )}
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="_key"
        size="small"
        pagination={false}
        scroll={{ x: "max-content" }}
        bordered
      />
      {hasMore && (
        <Text type="secondary" className="text-xs block text-center mt-1">
          +{data.rows.length - 5} dòng nữa
        </Text>
      )}
    </div>
  );
};

export default ChatDataTable;
