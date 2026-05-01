import { Form, Input, Select, Button, Card, Space, Typography } from "antd";
import { PlusOutlined, DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import type { ValueMappingSaveRequest, ValueMappingConfig } from "../types/dbLakehouse";

const { Title, Text } = Typography;

interface MappingEditorProps {
  initialData?: ValueMappingConfig | null;
  saving: boolean;
  onSave: (values: ValueMappingSaveRequest) => void;
}

export default function MappingEditor({ initialData, saving, onSave }: MappingEditorProps) {
  const [form] = Form.useForm();

  const handleFinish = (values: ValueMappingSaveRequest) => {
    onSave(values);
  };

  return (
    <Card>
      <Title level={5}>
        <SaveOutlined className="mr-2" />
        {initialData ? `Chỉnh sửa: ${initialData.name}` : "Tạo bộ mapping mới"}
      </Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={initialData || {
          case_insensitive: true,
          match_mode: "contains",
          mappings: [{ from_value: "", to_value: "" }],
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="name" label="Tên mapping" rules={[{ required: true, message: "Nhập tên" }]}>
            <Input placeholder="VD: viet_tat_ke_toan" disabled={!!initialData} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input placeholder="Mô tả ngắn gọn" />
          </Form.Item>
        </div>

        <div className="flex gap-4 mb-4">
          <Form.Item name="match_mode" label="Chế độ khớp" className="mb-0">
            <Select style={{ width: 200 }}>
              <Select.Option value="exact">Exact - Khớp chính xác</Select.Option>
              <Select.Option value="contains">Contains - Chứa chuỗi con</Select.Option>
              <Select.Option value="word">Word - Khớp theo từ</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="case_insensitive" label="Phân biệt hoa/thường" className="mb-0">
            <Select style={{ width: 200 }}>
              <Select.Option value={true}>Không phân biệt</Select.Option>
              <Select.Option value={false}>Có phân biệt</Select.Option>
            </Select>
          </Form.Item>
        </div>

        <Card size="small" title="Danh sách mapping" className="mb-4">
          <div className="mb-2">
            <Text type="secondary">Mỗi dòng: giá trị gốc → giá trị chuẩn hoá</Text>
          </div>
          <Form.List name="mappings" rules={[{
            validator: async (_, entries) => {
              if (!entries || entries.length === 0) throw new Error("Cần ít nhất 1 mapping");
            },
          }]}>
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} className="flex items-center mb-2" align="start">
                    <Form.Item
                      {...restField}
                      name={[name, "from_value"]}
                      rules={[{ required: true, message: "Nhập giá trị gốc" }]}
                    >
                      <Input placeholder="Giá trị gốc (VD: TSCD)" style={{ width: 220 }} />
                    </Form.Item>
                    <Text className="mx-1">→</Text>
                    <Form.Item
                      {...restField}
                      name={[name, "to_value"]}
                      rules={[{ required: true, message: "Nhập giá trị chuẩn hoá" }]}
                    >
                      <Input placeholder="Giá trị chuẩn hoá (VD: Tài sản cố định)" style={{ width: 280 }} />
                    </Form.Item>
                    <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add({ from_value: "", to_value: "" })} icon={<PlusOutlined />} block>
                  Thêm mapping
                </Button>
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>
        </Card>

        <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />} size="large">
          Lưu bộ mapping
        </Button>
      </Form>
    </Card>
  );
}
