import { Form, Input, Select, Switch, Button, Card, Space, Typography, Tag } from "antd";
import { PlayCircleOutlined, EyeOutlined, PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ValueMappingApplyRequest, ValueMappingListItem, DatabaseMeta } from "../types/dbLakehouse";

const { Title, Text } = Typography;

interface MappingApplyFormProps {
  savedMappings: ValueMappingListItem[];
  databases: DatabaseMeta[];
  applying: boolean;
  onApply: (values: ValueMappingApplyRequest) => void;
}

export default function MappingApplyForm({ savedMappings, databases, applying, onApply }: MappingApplyFormProps) {
  const [form] = Form.useForm();

  const handleFinish = (values: {
    database: string;
    tables?: string;
    columns?: string;
    mapping_name?: string;
    custom_mappings?: { from_value: string; to_value: string }[];
    case_insensitive: boolean;
    match_mode: string;
    dry_run: boolean;
    use_stream: boolean;
  }) => {
    const body: ValueMappingApplyRequest = {
      database: values.database,
      tables: values.tables ? values.tables.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      columns: values.columns ? values.columns.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      mapping_name: values.mapping_name || undefined,
      custom_mappings: values.custom_mappings?.length ? values.custom_mappings : undefined,
      case_insensitive: values.case_insensitive,
      match_mode: values.match_mode as "exact" | "contains" | "word",
      dry_run: values.dry_run,
    };
    onApply(body);
  };

  return (
    <Card>
      <Title level={5}>
        <PlayCircleOutlined className="mr-2" />
        Áp dụng Mapping vào Database
      </Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ case_insensitive: true, match_mode: "contains", dry_run: true }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="database"
            label="Database"
            rules={[{ required: true, message: "Chọn database" }]}
          >
            <Select placeholder="Chọn database">
              {databases.map((db) => (
                <Select.Option key={db.database} value={db.database}>
                  <Tag color={db.layer === "bronze" ? "orange" : db.layer === "silver" ? "blue" : "gold"} className="mr-1">
                    {db.layer}
                  </Tag>
                  {db.database}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="mapping_name" label="Bộ mapping đã lưu">
            <Select placeholder="Chọn mapping (hoặc dùng custom bên dưới)" allowClear>
              {savedMappings.map((m) => (
                <Select.Option key={m.name} value={m.name}>
                  {m.name} ({m.mapping_count} rules)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="tables" label="Bảng (phân cách bằng dấu phẩy, để trống = tất cả)">
            <Input placeholder="VD: BaoCaoTaiChinh, SoKeToan" />
          </Form.Item>
          <Form.Item name="columns" label="Cột (phân cách bằng dấu phẩy, để trống = tất cả cột string)">
            <Input placeholder="VD: TenChiTieu, GhiChu" />
          </Form.Item>
        </div>

        <div className="flex gap-4 mb-4">
          <Form.Item name="match_mode" label="Chế độ khớp" className="mb-0">
            <Select style={{ width: 200 }}>
              <Select.Option value="exact">Exact</Select.Option>
              <Select.Option value="contains">Contains</Select.Option>
              <Select.Option value="word">Word</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="case_insensitive" valuePropName="checked" label="Không phân biệt hoa/thường" className="mb-0">
            <Switch />
          </Form.Item>
          <Form.Item name="dry_run" valuePropName="checked" label="Dry Run (chỉ xem trước)" className="mb-0">
            <Switch checkedChildren="Xem trước" unCheckedChildren="Áp dụng thật" />
          </Form.Item>
        </div>

        <Card size="small" title="Custom Mappings (tuỳ chọn - ưu tiên hơn mapping đã lưu)" className="mb-4">
          <Form.List name="custom_mappings">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} className="flex items-center mb-2" align="start">
                    <Form.Item {...restField} name={[name, "from_value"]}>
                      <Input placeholder="Giá trị gốc" style={{ width: 220 }} />
                    </Form.Item>
                    <Text className="mx-1">→</Text>
                    <Form.Item {...restField} name={[name, "to_value"]}>
                      <Input placeholder="Giá trị chuẩn hoá" style={{ width: 280 }} />
                    </Form.Item>
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                  </Space>
                ))}
                <Button type="dashed" size="small" onClick={() => add({ from_value: "", to_value: "" })} icon={<PlusOutlined />}>
                  Thêm custom mapping
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        <Space>
          <Button type="primary" htmlType="submit" loading={applying} icon={<PlayCircleOutlined />} size="large">
            Áp dụng Mapping
          </Button>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.dry_run !== cur.dry_run}>
            {({ getFieldValue }) =>
              getFieldValue("dry_run") && (
                <Tag icon={<EyeOutlined />} color="green">Chế độ xem trước - không thay đổi dữ liệu</Tag>
              )
            }
          </Form.Item>
        </Space>
      </Form>
    </Card>
  );
}
