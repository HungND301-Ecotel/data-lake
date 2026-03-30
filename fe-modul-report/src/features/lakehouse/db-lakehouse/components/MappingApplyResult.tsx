import { Card, Descriptions, Tag, Table, Typography, Collapse, Alert } from "antd";
import { CheckCircleOutlined, EyeOutlined } from "@ant-design/icons";
import type { ValueMappingApplyResponse, ValueMappingTableResult, ValueMappingResultDetail } from "../types/dbLakehouse";

const { Text } = Typography;

interface MappingApplyResultProps {
  result: ValueMappingApplyResponse;
}

export default function MappingApplyResult({ result }: MappingApplyResultProps) {
  const detailColumns = [
    { title: "Cột", dataIndex: "column", key: "column", width: 150 },
    {
      title: "Giá trị gốc",
      dataIndex: "from_value",
      key: "from_value",
      render: (v: string) => <Tag color="red">{v}</Tag>,
    },
    {
      title: "Giá trị mới",
      dataIndex: "to_value",
      key: "to_value",
      render: (v: string) => <Tag color="green">{v}</Tag>,
    },
    {
      title: "Số lần khớp",
      dataIndex: "matches",
      key: "matches",
      width: 120,
      render: (v: number) => <Text strong>{v.toLocaleString()}</Text>,
    },
    {
      title: "Đã áp dụng",
      dataIndex: "applied",
      key: "applied",
      width: 120,
      render: (v: boolean) =>
        v ? <Tag color="success">Đã áp dụng</Tag> : <Tag color="warning">Chưa áp dụng</Tag>,
    },
  ];

  const tableItems = result.results.map((r: ValueMappingTableResult) => ({
    key: r.table_name,
    label: (
      <span>
        <Text strong>{r.table_name}</Text>
        <Tag className="ml-2" color="blue">{r.columns_scanned} cột</Tag>
        <Tag color={r.total_replacements > 0 ? "orange" : "default"}>
          {r.total_replacements.toLocaleString()} thay thế
        </Tag>
      </span>
    ),
    children: (
      <Table<ValueMappingResultDetail>
        dataSource={r.details}
        columns={detailColumns}
        rowKey={(d) => `${d.column}-${d.from_value}`}
        size="small"
        pagination={false}
      />
    ),
  }));

  return (
    <Card
      title={
        <>
          {result.dry_run
            ? <><EyeOutlined className="text-blue-500 mr-2" />Kết quả xem trước (Dry Run)</>
            : <><CheckCircleOutlined className="text-green-500 mr-2" />Kết quả áp dụng Mapping</>
          }
        </>
      }
      size="small"
    >
      {result.dry_run && (
        <Alert
          message="Đây là chế độ xem trước (Dry Run) - chưa có thay đổi nào được lưu vào database"
          type="info"
          showIcon
          className="mb-3"
        />
      )}

      <Descriptions size="small" bordered column={2} className="mb-3">
        <Descriptions.Item label="Database">{result.database}</Descriptions.Item>
        <Descriptions.Item label="Tổng thay thế">
          <Text strong className="text-lg">{result.total_replacements.toLocaleString()}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Bảng đã quét" span={2}>
          {result.tables_processed.map((t) => <Tag key={t}>{t}</Tag>)}
        </Descriptions.Item>
      </Descriptions>

      <Collapse items={tableItems} defaultActiveKey={result.results.map((r) => r.table_name)} />

      <Text type="success" className="block mt-3">{result.message}</Text>
    </Card>
  );
}
