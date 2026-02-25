import { Table, Button, Tag, Typography } from "antd";
import { CheckCircleOutlined, DownloadOutlined } from "@ant-design/icons";
import type { GoldRecord } from "../types/gold";

const { Text } = Typography;

interface Props {
  records: GoldRecord[];
  loading: boolean;
  onConfirm: (goldId: string) => void;
  getDownloadUrl: (goldId: string) => string;
}

export default function GoldReviewTable({ records, loading, onConfirm, getDownloadUrl }: Props) {
  const columns = [
    {
      title: "Gold ID",
      dataIndex: "gold_id",
      key: "gold_id",
      width: 120,
      render: (id: string) => <Text className="font-mono text-xs">{id.substring(0, 12)}...</Text>,
    },
    {
      title: "File ID",
      dataIndex: "file_id",
      key: "file_id",
      width: 120,
      render: (id: string) => <Text className="font-mono text-xs">{id.substring(0, 12)}...</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "confirmed",
      key: "confirmed",
      width: 120,
      render: (confirmed: boolean) => (
        <Tag color={confirmed ? "success" : "warning"} icon={confirmed ? <CheckCircleOutlined /> : undefined}>
          {confirmed ? "Đã xác nhận" : "Chờ xác nhận"}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 200,
      render: (_: unknown, record: GoldRecord) => (
        <div className="flex gap-2">
          {!record.confirmed && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => onConfirm(record.gold_id)}>
              Xác nhận
            </Button>
          )}
          <Button size="small" icon={<DownloadOutlined />} href={getDownloadUrl(record.gold_id)}>
            JSON
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={records}
      rowKey="gold_id"
      loading={loading}
      size="small"
      pagination={{ pageSize: 10 }}
    />
  );
}
