import { useState } from "react";
import { List, Card, Button, Input, Form, Tag, Typography } from "antd";
import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import type { GoldPrompt, GoldPromptCreateRequest } from "../types/gold";

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  prompts: GoldPrompt[];
  onSave: (data: GoldPromptCreateRequest) => Promise<{ success: boolean; error?: string }>;
}

export default function PromptTemplateList({ prompts, onSave }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const handleSave = async (values: { prompt_text: string; columns: string; description: string }) => {
    setSaving(true);
    const cols = values.columns?.split(",").map((c) => c.trim()).filter(Boolean) || [];
    const result = await onSave({
      prompt_text: values.prompt_text,
      columns_to_extract: cols,
      description: values.description,
    });
    if (result.success) {
      setShowForm(false);
      form.resetFields();
    }
    setSaving(false);
  };

  return (
    <Card
      title="Prompt Templates"
      size="small"
      extra={
        <Button size="small" icon={<PlusOutlined />} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Huỷ" : "Thêm"}
        </Button>
      }
    >
      {showForm && (
        <Form form={form} layout="vertical" onFinish={handleSave} className="mb-4 p-3 bg-gray-50 rounded">
          <Form.Item name="description" label="Mô tả">
            <Input placeholder="VD: Template cho hoá đơn VAT" />
          </Form.Item>
          <Form.Item name="prompt_text" label="Prompt" rules={[{ required: true }]}>
            <TextArea rows={2} placeholder="Nhập prompt trích xuất" />
          </Form.Item>
          <Form.Item name="columns" label="Cột (cách nhau bởi dấu phẩy)">
            <Input placeholder="so_hoa_don, ngay, tong_tien" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving} icon={<SaveOutlined />} size="small">
            Lưu template
          </Button>
        </Form>
      )}

      <List
        dataSource={prompts}
        renderItem={(item) => (
          <List.Item>
            <div>
              <Text strong>{item.description || "Không có mô tả"}</Text>
              <div className="text-sm text-gray-500 mt-1">{item.prompt_text.substring(0, 100)}...</div>
              <div className="mt-1">
                {item.columns_to_extract.map((col) => (
                  <Tag key={col} className="text-xs">{col}</Tag>
                ))}
              </div>
            </div>
          </List.Item>
        )}
        locale={{ emptyText: "Chưa có template nào" }}
      />
    </Card>
  );
}
