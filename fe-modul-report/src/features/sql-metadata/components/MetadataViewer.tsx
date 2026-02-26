import { Card, Tree, Descriptions, Tag, Table, Typography, Empty, Collapse } from "antd";
import {
  TableOutlined,
  KeyOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import type { SqlMetadata, SqlRelationship } from "../types/sqlMetadata";

const { Text, Paragraph } = Typography;

interface Props {
  metadata: SqlMetadata;
}

export default function MetadataViewer({ metadata }: Props) {
  const treeData = metadata.tables.map((table) => ({
    title: (
      <span>
        <TableOutlined className="mr-1" />
        <Text strong>{table.table_name}</Text>
        {table.row_count !== undefined && (
          <Tag className="ml-2" color="blue">{table.row_count} rows</Tag>
        )}
      </span>
    ),
    key: table.table_name,
    children: table.columns.map((col) => ({
      title: (
        <span>
          {col.is_primary_key && <KeyOutlined className="mr-1 text-yellow-500" />}
          {col.is_foreign_key && <LinkOutlined className="mr-1 text-blue-500" />}
          <Text>{col.column_name}</Text>
          <Tag className="ml-2" color={col.nullable ? "default" : "orange"}>
            {col.data_type}
          </Tag>
          {!col.nullable && <Tag color="red">NOT NULL</Tag>}
          {col.description && (
            <Text type="secondary" className="ml-2 text-xs">
              {col.description}
            </Text>
          )}
        </span>
      ),
      key: `${table.table_name}.${col.column_name}`,
      isLeaf: true,
    })),
  }));

  const relationshipColumns = [
    { title: "Từ bảng", dataIndex: "from_table", key: "from_table" },
    { title: "Cột nguồn", dataIndex: "from_column", key: "from_column" },
    { title: "Đến bảng", dataIndex: "to_table", key: "to_table" },
    { title: "Cột đích", dataIndex: "to_column", key: "to_column" },
    {
      title: "Loại",
      dataIndex: "relationship_type",
      key: "relationship_type",
      render: (type: string) => <Tag color="purple">{type}</Tag>,
    },
  ];

  return (
    <div className="space-y-4">
      <Card size="small" title="Tổng quan">
        <Descriptions size="small" column={2}>
          <Descriptions.Item label="Database Type">
            <Tag color="blue">{metadata.database_type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Số bảng">{metadata.tables.length}</Descriptions.Item>
          <Descriptions.Item label="Analysis ID">
            <Text code copyable>{metadata.analysis_id}</Text>
          </Descriptions.Item>
        </Descriptions>
        {metadata.summary && (
          <Paragraph type="secondary" className="mt-2 mb-0">{metadata.summary}</Paragraph>
        )}
      </Card>

      <Collapse
        defaultActiveKey={["tables"]}
        items={[
          {
            key: "tables",
            label: `Bảng & Cột (${metadata.tables.length} bảng)`,
            children: metadata.tables.length > 0 ? (
              <Tree
                treeData={treeData}
                defaultExpandAll={metadata.tables.length <= 10}
                showLine
                selectable={false}
              />
            ) : (
              <Empty description="Không có bảng" />
            ),
          },
          {
            key: "relationships",
            label: `Quan hệ (${metadata.relationships.length})`,
            children: metadata.relationships.length > 0 ? (
              <Table<SqlRelationship>
                dataSource={metadata.relationships}
                columns={relationshipColumns}
                rowKey={(r) => `${r.from_table}.${r.from_column}-${r.to_table}.${r.to_column}`}
                size="small"
                pagination={false}
              />
            ) : (
              <Empty description="Không tìm thấy quan hệ" />
            ),
          },
          {
            key: "details",
            label: "Chi tiết từng bảng",
            children: metadata.tables.map((table) => (
              <Card key={table.table_name} size="small" title={table.table_name} className="mb-2">
                {table.description && (
                  <Paragraph type="secondary">{table.description}</Paragraph>
                )}
                <Table
                  dataSource={table.columns}
                  rowKey="column_name"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: "Cột", dataIndex: "column_name", key: "name" },
                    { title: "Kiểu", dataIndex: "data_type", key: "type", render: (t: string) => <Tag>{t}</Tag> },
                    {
                      title: "PK",
                      dataIndex: "is_primary_key",
                      key: "pk",
                      render: (v: boolean) => v ? <KeyOutlined className="text-yellow-500" /> : null,
                      width: 50,
                    },
                    {
                      title: "FK",
                      dataIndex: "is_foreign_key",
                      key: "fk",
                      render: (v: boolean) => v ? <LinkOutlined className="text-blue-500" /> : null,
                      width: 50,
                    },
                    {
                      title: "Nullable",
                      dataIndex: "nullable",
                      key: "nullable",
                      render: (v: boolean) => v ? <Tag>Yes</Tag> : <Tag color="red">No</Tag>,
                      width: 80,
                    },
                    { title: "Mô tả", dataIndex: "description", key: "desc", ellipsis: true },
                  ]}
                />
              </Card>
            )),
          },
        ]}
      />
    </div>
  );
}
