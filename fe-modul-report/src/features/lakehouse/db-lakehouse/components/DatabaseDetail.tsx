import { Descriptions, Table, Tag, Card, Typography, Collapse } from "antd";
import type { DatabaseInfoResponse, TableInfo, ColumnInfo } from "../types/dbLakehouse";

const { Title } = Typography;

interface DatabaseDetailProps {
  data: DatabaseInfoResponse;
}

const layerColors = { bronze: "orange", silver: "blue", gold: "gold" };

export default function DatabaseDetail({ data }: DatabaseDetailProps) {
  const columnTableColumns = [
    { title: "Tên cột", dataIndex: "name", key: "name" },
    { title: "Kiểu", dataIndex: "type", key: "type", width: 120 },
    {
      title: "Nullable",
      dataIndex: "nullable",
      key: "nullable",
      width: 90,
      render: (v: boolean) => (v ? <Tag color="warning">Yes</Tag> : <Tag color="success">No</Tag>),
    },
    {
      title: "Max Length",
      dataIndex: "max_length",
      key: "max_length",
      width: 100,
      render: (v: number | null) => v ?? "-",
    },
  ];

  const tableItems = data.tables.map((t: TableInfo) => ({
    key: t.table_name,
    label: (
      <span>
        <strong>{t.table_name}</strong>
        <Tag className="ml-2">{t.row_count.toLocaleString()} dòng</Tag>
        <Tag>{t.column_count} cột</Tag>
      </span>
    ),
    children: (
      <Table<ColumnInfo>
        dataSource={t.columns}
        columns={columnTableColumns}
        rowKey="name"
        size="small"
        pagination={false}
      />
    ),
  }));

  return (
    <div className="space-y-4">
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="Database">{data.database_name}</Descriptions.Item>
        <Descriptions.Item label="Layer">
          <Tag color={layerColors[data.layer]}>{data.layer.toUpperCase()}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Tổng bảng">{data.total_tables}</Descriptions.Item>
        <Descriptions.Item label="Tổng dòng">{data.total_rows.toLocaleString()}</Descriptions.Item>
      </Descriptions>

      <Card size="small">
        <Title level={5} className="mb-3">Danh sách bảng</Title>
        <Collapse items={tableItems} />
      </Card>
    </div>
  );
}
