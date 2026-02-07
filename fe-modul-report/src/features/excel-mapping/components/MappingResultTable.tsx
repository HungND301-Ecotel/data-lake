import { Table, Tag, Progress, Card, Descriptions, Typography } from "antd";
import type { ExcelMappingResponse, ColumnMapping } from "../types/excelMapping";

const { Text } = Typography;

interface Props {
  result: ExcelMappingResponse;
}

export default function MappingResultTable({ result }: Props) {
  const columns = [
    {
      title: "Cột nguồn",
      dataIndex: "source_column",
      key: "source",
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: "Cột đích (gợi ý)",
      dataIndex: "target_column",
      key: "target",
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: "Độ tin cậy",
      dataIndex: "confidence",
      key: "confidence",
      render: (v: number) => (
        <Progress
          percent={Math.round(v * 100)}
          size="small"
          status={v >= 0.8 ? "success" : v >= 0.5 ? "normal" : "exception"}
        />
      ),
      width: 180,
    },
    {
      title: "Kiểu dữ liệu",
      dataIndex: "data_type",
      key: "data_type",
      render: (v: string) => <Tag>{v}</Tag>,
    },
  ];

  return (
    <div className="space-y-4">
      <Card size="small">
        <Descriptions size="small" column={3}>
          <Descriptions.Item label="File">{result.filename}</Descriptions.Item>
          <Descriptions.Item label="Số cột phát hiện">
            <Tag color="blue">{result.result.columns_detected}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Số mapping gợi ý">
            <Tag color="green">{result.result.suggested_mappings.length}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Table<ColumnMapping>
        dataSource={result.result.suggested_mappings}
        columns={columns}
        rowKey="source_column"
        size="small"
        pagination={false}
      />

      {Object.keys(result.result.data_types).length > 0 && (
        <Card size="small" title="Data Types phát hiện">
          <div className="flex flex-wrap gap-2">
            {Object.entries(result.result.data_types).map(([col, type]) => (
              <Tag key={col}>
                {col}: <Text strong>{type}</Text>
              </Tag>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
