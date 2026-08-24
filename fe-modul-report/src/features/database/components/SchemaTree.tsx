import { Tree, Tag, Spin, Empty } from "antd";
import { TableOutlined, FieldNumberOutlined } from "@ant-design/icons";
import type { SchemaResponse } from "../types/database";
import type { DataNode } from "antd/es/tree";

interface Props {
  schema: SchemaResponse | null;
  loading: boolean;
  onTableSelect?: (tableName: string) => void;
}

export default function SchemaTree({ schema, loading, onTableSelect }: Props) {
  if (loading) return <div className="flex justify-center py-8"><Spin /></div>;
  if (!schema) return <Empty description="Chọn database để xem schema" />;

  const treeData: DataNode[] = schema.tables.map((table) => ({
    key: table.table_name,
    title: (
      <span className="flex items-center gap-2">
        <TableOutlined />
        <span className="font-medium">{table.table_name}</span>
        <Tag className="text-xs">{table.columns.length} cột</Tag>
      </span>
    ),
    children: table.columns.map((col) => ({
      key: `${table.table_name}.${col.name}`,
      title: (
        <span className="flex items-center gap-2">
          <FieldNumberOutlined className="text-gray-400" />
          <span>{col.name}</span>
          <Tag color="green" className="text-xs">{col.type}</Tag>
          {!col.nullable && <Tag color="red" className="text-xs">NOT NULL</Tag>}
        </span>
      ),
      isLeaf: true,
    })),
  }));

  return (
    <div>
      <div className="text-sm text-gray-500 mb-2">
        {schema.total_tables} bảng trong {schema.database}
      </div>
      <Tree
        treeData={treeData}
        showLine
        defaultExpandAll={schema.tables.length <= 10}
        onSelect={(keys) => {
          if (keys.length > 0) {
            const key = keys[0] as string;
            if (!key.includes(".")) {
              onTableSelect?.(key);
            }
          }
        }}
      />
    </div>
  );
}
