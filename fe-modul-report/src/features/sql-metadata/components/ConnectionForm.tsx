import { Form, Input, Select, Button, Card } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import type { AnalyzeSchemaRequest } from "../types/sqlMetadata";

interface Props {
  loading: boolean;
  onAnalyze: (data: AnalyzeSchemaRequest) => void;
}

export default function ConnectionForm({ loading, onAnalyze }: Props) {
  const [form] = Form.useForm();

  const handleSubmit = (values: {
    connection_string: string;
    database_type: string;
    tables?: string;
  }) => {
    const tables = values.tables
      ? values.tables.split(",").map((t) => t.trim()).filter(Boolean)
      : undefined;
    onAnalyze({
      connection_string: values.connection_string,
      database_type: values.database_type,
      tables,
    });
  };

  return (
    <Card title="Kết nối Database" size="small">
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="connection_string"
          label="Connection String"
          rules={[{ required: true, message: "Vui lòng nhập connection string" }]}
        >
          <Input.TextArea
            rows={2}
            placeholder="mssql+pyodbc://user:pass@host:1433/dbname?driver=ODBC+Driver+17+for+SQL+Server"
          />
        </Form.Item>

        <Form.Item
          name="database_type"
          label="Loại Database"
          rules={[{ required: true, message: "Vui lòng chọn loại database" }]}
          initialValue="mssql"
        >
          <Select
            options={[
              { value: "mssql", label: "SQL Server" },
              { value: "mysql", label: "MySQL" },
              { value: "postgresql", label: "PostgreSQL" },
              { value: "oracle", label: "Oracle" },
              { value: "sqlite", label: "SQLite" },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="tables"
          label="Bảng cần phân tích (tuỳ chọn)"
          help="Nhập tên bảng, cách nhau bằng dấu phẩy. Để trống để phân tích tất cả."
        >
          <Input placeholder="table1, table2, table3" />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={<ThunderboltOutlined />}
          block
        >
          Phân tích Schema
        </Button>
      </Form>
    </Card>
  );
}
