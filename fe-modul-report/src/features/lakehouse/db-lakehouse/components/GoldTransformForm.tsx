import { Form, Input, Select, Switch, Button, Card, Space, Typography } from "antd";
import { PlusOutlined, DeleteOutlined, GoldOutlined } from "@ant-design/icons";
import type { GoldTransformRequest, GoldTableMapping, GoldColumnMapping } from "../types/dbLakehouse";
import type { DatabaseMeta } from "../types/dbLakehouse";

const { Title } = Typography;

const TRANSFORMS = [
  { value: "normalize_date", label: "Normalize Date" },
  { value: "normalize_phone", label: "Normalize Phone (+84)" },
  { value: "normalize_name", label: "Normalize Name (Title Case)" },
  { value: "uppercase", label: "Uppercase" },
  { value: "lowercase", label: "Lowercase" },
  { value: "trim", label: "Trim" },
  { value: "format_currency", label: "Format Currency" },
  { value: "cast_type", label: "Cast Type" },
];

interface GoldTransformFormProps {
  silverDatabases: DatabaseMeta[];
  loading: boolean;
  onSubmit: (values: GoldTransformRequest) => void;
}

export default function GoldTransformForm({ silverDatabases, loading, onSubmit }: GoldTransformFormProps) {
  const [form] = Form.useForm();

  const handleFinish = (values: {
    silver_database: string;
    gold_database?: string;
    auto_standardize: boolean;
    table_mappings?: {
      source_table: string;
      target_table?: string;
      columns?: GoldColumnMapping[];
    }[];
  }) => {
    const body: GoldTransformRequest = {
      silver_database: values.silver_database,
      gold_database: values.gold_database || undefined,
      auto_standardize: values.auto_standardize,
      table_mappings: values.table_mappings?.length
        ? values.table_mappings as GoldTableMapping[]
        : undefined,
    };
    onSubmit(body);
  };

  return (
    <Card>
      <Title level={5}>
        <GoldOutlined className="mr-2 text-yellow-500" />
        Gold Transform (Chuẩn hóa dữ liệu)
      </Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ auto_standardize: true }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="silver_database"
            label="Silver Database (nguồn)"
            rules={[{ required: true, message: "Chọn Silver database" }]}
          >
            <Select placeholder="Chọn Silver database">
              {silverDatabases.map((db) => (
                <Select.Option key={db.database} value={db.database}>{db.database}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="gold_database" label="Gold Database (đích - để trống = tự động)">
            <Input placeholder="Tự động tạo tên" />
          </Form.Item>
        </div>

        <Form.Item name="auto_standardize" valuePropName="checked" className="mb-4">
          <Switch checkedChildren="AI Auto Standardize" unCheckedChildren="Thủ công" />
        </Form.Item>

        <Card size="small" title="Table Mappings (tùy chọn)" className="mb-4">
          <Form.List name="table_mappings">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card key={key} size="small" className="mb-3" extra={
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                  }>
                    <div className="grid grid-cols-2 gap-3">
                      <Form.Item {...restField} name={[name, "source_table"]} label="Bảng nguồn"
                        rules={[{ required: true, message: "Nhập tên bảng nguồn" }]}>
                        <Input placeholder="Tên bảng trong Silver" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, "target_table"]} label="Bảng đích">
                        <Input placeholder="Tên mới (để trống = giữ nguyên)" />
                      </Form.Item>
                    </div>

                    <Form.List name={[name, "columns"]}>
                      {(colFields, { add: addCol, remove: removeCol }) => (
                        <>
                          {colFields.map(({ key: colKey, name: colName, ...colRest }) => (
                            <Space key={colKey} className="flex items-start mb-1" align="start">
                              <Form.Item {...colRest} name={[colName, "source_column"]}
                                rules={[{ required: true, message: "Cột nguồn" }]}>
                                <Input placeholder="Cột nguồn" style={{ width: 140 }} />
                              </Form.Item>
                              <Form.Item {...colRest} name={[colName, "target_column"]}>
                                <Input placeholder="Cột đích" style={{ width: 140 }} />
                              </Form.Item>
                              <Form.Item {...colRest} name={[colName, "transform"]}>
                                <Select placeholder="Transform" style={{ width: 180 }} options={TRANSFORMS} allowClear />
                              </Form.Item>
                              <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeCol(colName)} />
                            </Space>
                          ))}
                          <Button type="dashed" size="small" onClick={() => addCol()} icon={<PlusOutlined />}>
                            Thêm column mapping
                          </Button>
                        </>
                      )}
                    </Form.List>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                  Thêm table mapping
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        <Button type="primary" htmlType="submit" loading={loading} icon={<GoldOutlined />} size="large">
          Chạy Gold Transform
        </Button>
      </Form>
    </Card>
  );
}
