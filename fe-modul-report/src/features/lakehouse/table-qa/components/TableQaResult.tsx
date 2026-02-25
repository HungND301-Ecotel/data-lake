import { Card, Table, Typography, Tag, Empty } from "antd";
import ReactMarkdown from "react-markdown";
import type { TableQaResponse } from "../types/tableQa";

const { Text } = Typography;

interface Props {
  result: TableQaResponse | null;
  datalakeBaseUrl?: string;
}

export default function TableQaResult({ result, datalakeBaseUrl }: Props) {
  if (!result) return <Empty description="Upload file Excel/CSV và đặt câu hỏi" />;

  const columns = result.data_context.columns.map((col) => ({
    title: col,
    dataIndex: col,
    key: col,
    ellipsis: true,
  }));

  return (
    <div className="space-y-4">
      <Card title="Câu trả lời" size="small">
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{result.answer}</ReactMarkdown>
        </div>
      </Card>

      {result.chart && (
        <Card title={result.chart.title} size="small">
          <img
            src={`${datalakeBaseUrl || ""}${result.chart.chart_url}`}
            alt={result.chart.title}
            className="max-w-full rounded"
          />
        </Card>
      )}

      <Card
        title="Data Context"
        size="small"
        extra={
          <Text type="secondary">
            {result.data_context.row_count} hàng | {result.data_context.columns.length} cột
          </Text>
        }
      >
        <div className="mb-2">
          {result.data_context.columns.map((col) => (
            <Tag key={col} className="text-xs">{col}</Tag>
          ))}
        </div>
        <Table
          columns={columns}
          dataSource={result.data_context.sample_data.map((row, i) => ({ ...row, _key: i }))}
          rowKey="_key"
          size="small"
          pagination={false}
          scroll={{ x: result.data_context.columns.length * 120 }}
        />
      </Card>
    </div>
  );
}
