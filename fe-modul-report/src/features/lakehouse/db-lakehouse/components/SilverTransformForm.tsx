import { Form, Input, Select, Switch, Button, Card, Space, Typography } from "antd";
import { PlusOutlined, DeleteOutlined, ThunderboltOutlined } from "@ant-design/icons";
import type { SilverTransformRequest, CleaningRule } from "../types/dbLakehouse";
import type { DatabaseMeta } from "../types/dbLakehouse";

const { Title } = Typography;

const ACTIONS = [
  { value: "trim", label: "Trim (xóa khoảng trắng)" },
  { value: "lowercase", label: "Lowercase" },
  { value: "uppercase", label: "Uppercase" },
  { value: "fill_default", label: "Fill Default (điền giá trị mặc định)" },
  { value: "cast_type", label: "Cast Type (chuyển kiểu)" },
  { value: "remove_empty_strings", label: "Remove Empty Strings" },
  { value: "regex_replace", label: "Regex Replace" },
  { value: "normalize_date", label: "Normalize Date" },
];

const ACTIONS_WITH_PARAMS = ["fill_default", "cast_type", "regex_replace", "normalize_date"];

interface SilverTransformFormProps {
  bronzeDatabases: DatabaseMeta[];
  loading: boolean;
  onSubmit: (values: SilverTransformRequest) => void;
}

export default function SilverTransformForm({ bronzeDatabases, loading, onSubmit }: SilverTransformFormProps) {
  const [form] = Form.useForm();

  const handleFinish = (values: {
    bronze_database: string;
    silver_database?: string;
    auto_clean: boolean;
    remove_duplicates: boolean;
    remove_null_rows: boolean;
    custom_rules?: CleaningRule[];
  }) => {
    const body: SilverTransformRequest = {
      bronze_database: values.bronze_database,
      silver_database: values.silver_database || undefined,
      auto_clean: values.auto_clean,
      remove_duplicates: values.remove_duplicates,
      remove_null_rows: values.remove_null_rows,
      custom_rules: values.custom_rules?.length ? values.custom_rules : undefined,
    };
    onSubmit(body);
  };

  return (
    <Card>
      <Title level={5}>
        <ThunderboltOutlined className="mr-2 text-blue-500" />
        Silver Transform (Clean & Validate)
      </Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ auto_clean: true, remove_duplicates: true, remove_null_rows: false }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="bronze_database"
            label="Bronze Database (nguồn)"
            rules={[{ required: true, message: "Chọn Bronze database" }]}
          >
            <Select placeholder="Chọn Bronze database">
              {bronzeDatabases.map((db) => (
                <Select.Option key={db.database} value={db.database}>{db.database}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="silver_database" label="Silver Database (đích - để trống = tự động)">
            <Input placeholder="Tự động tạo tên" />
          </Form.Item>
        </div>

        <div className="flex gap-6 mb-4">
          <Form.Item name="auto_clean" valuePropName="checked" className="mb-0">
            <Switch checkedChildren="AI Auto Clean" unCheckedChildren="Thủ công" />
          </Form.Item>
          <Form.Item name="remove_duplicates" valuePropName="checked" className="mb-0">
            <Switch checkedChildren="Xóa trùng lặp" unCheckedChildren="Giữ trùng lặp" />
          </Form.Item>
          <Form.Item name="remove_null_rows" valuePropName="checked" className="mb-0">
            <Switch checkedChildren="Xóa dòng NULL" unCheckedChildren="Giữ dòng NULL" />
          </Form.Item>
        </div>

        <Card size="small" title="Custom Rules (tùy chọn)" className="mb-4">
          <Form.List name="custom_rules">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} className="flex items-start mb-2" align="start">
                    <Form.Item {...restField} name={[name, "column"]} rules={[{ required: true, message: "Nhập tên cột" }]}>
                      <Input placeholder="Tên cột" style={{ width: 160 }} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, "action"]} rules={[{ required: true, message: "Chọn action" }]}>
                      <Select placeholder="Action" style={{ width: 220 }} options={ACTIONS} />
                    </Form.Item>
                    <Form.Item
                      noStyle
                      shouldUpdate={(prev, cur) =>
                        prev?.custom_rules?.[name]?.action !== cur?.custom_rules?.[name]?.action
                      }
                    >
                      {({ getFieldValue }) => {
                        const action = getFieldValue(["custom_rules", name, "action"]);
                        if (!ACTIONS_WITH_PARAMS.includes(action)) return null;
                        return (
                          <Form.Item {...restField} name={[name, "params", "value"]}>
                            <Input placeholder="Giá trị param" style={{ width: 160 }} />
                          </Form.Item>
                        );
                      }}
                    </Form.Item>
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                  Thêm rule
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        <Button type="primary" htmlType="submit" loading={loading} icon={<ThunderboltOutlined />} size="large">
          Chạy Silver Transform
        </Button>
      </Form>
    </Card>
  );
}
