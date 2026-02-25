import { Form, Input, Button, Select } from "antd";
import { ThunderboltOutlined } from "@ant-design/icons";
import type { GoldPrompt } from "../types/gold";
import type { RawFile } from "../../shared/types/lakehouse";

const { TextArea } = Input;

interface Props {
  rawFiles: RawFile[];
  prompts: GoldPrompt[];
  loading: boolean;
  onExtract: (fileId: string, prompt: string, columns: string[]) => void;
}

export default function GoldExtractionForm({ rawFiles, prompts, loading, onExtract }: Props) {
  const [form] = Form.useForm();

  const handlePromptSelect = (promptId: string) => {
    const prompt = prompts.find((p) => p.prompt_id === promptId);
    if (prompt) {
      form.setFieldsValue({
        prompt: prompt.prompt_text,
        columns: prompt.columns_to_extract.join(", "),
      });
    }
  };

  const handleSubmit = (values: { file_id: string; prompt: string; columns?: string }) => {
    const cols = values.columns?.split(",").map((c) => c.trim()).filter(Boolean) || [];
    onExtract(values.file_id, values.prompt, cols);
  };

  return (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item name="file_id" label="Chọn file (từ Bronze layer)" rules={[{ required: true, message: "Chọn file" }]}>
        <Select
          placeholder="Chọn file đã OCR"
          showSearch
          options={rawFiles.map((f) => ({ value: f.file_id, label: f.filename }))}
        />
      </Form.Item>

      {prompts.length > 0 && (
        <Form.Item label="Sử dụng Prompt Template">
          <Select
            placeholder="Chọn template (tùy chọn)"
            allowClear
            onChange={handlePromptSelect}
            options={prompts.map((p) => ({ value: p.prompt_id, label: p.description || p.prompt_text.substring(0, 50) }))}
          />
        </Form.Item>
      )}

      <Form.Item name="prompt" label="Prompt trích xuất" rules={[{ required: true, message: "Nhập prompt" }]}>
        <TextArea rows={3} placeholder="VD: Trích xuất số hoá đơn, ngày, tên khách hàng, tổng tiền" />
      </Form.Item>

      <Form.Item name="columns" label="Tên cột (cách nhau bởi dấu phẩy)">
        <Input placeholder="VD: so_hoa_don, ngay, ten_khach_hang, tong_tien" />
      </Form.Item>

      <Button type="primary" htmlType="submit" loading={loading} icon={<ThunderboltOutlined />}>
        Trích xuất Gold
      </Button>
    </Form>
  );
}
