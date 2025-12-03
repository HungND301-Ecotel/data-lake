// AddReportModal.tsx
import { Modal, Button, Upload, Input, Select, Form, Space } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Option } = Select;

interface AddReportModalProps {
  open: boolean;
  onCancel: () => void;
  onAdd: (data: any) => void;
  departments: string[];
  types: string[];
  defaultMode?: "Tĩnh" | "Động";
}

const AddReportModal: React.FC<AddReportModalProps> = ({
  open,
  onCancel,
  onAdd,
  departments,
  types,
  defaultMode = "Tĩnh",
}) => {
  const [mode, setMode] = useState<"Tĩnh" | "Động">(defaultMode);
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onAdd({ mode, ...values });
      form.resetFields();
    });
  };

  return (
    <Modal
      title="Thêm báo cáo"
      open={open}
      onCancel={onCancel}
      footer={<Button type="primary" onClick={handleSubmit}>Thêm</Button>}
    >
      {/* Chọn chế độ: Tĩnh / Động */}
      <Space className="mb-4">
        <Button
          type={mode === "Tĩnh" ? "primary" : "default"}
          onClick={() => setMode("Tĩnh")}
        >
          Tĩnh
        </Button>
        <Button
          type={mode === "Động" ? "primary" : "default"}
          onClick={() => setMode("Động")}
        >
          Động
        </Button>
      </Space>

      {/* Nội dung form */}
      <Form form={form} layout="vertical">
        {/* Tên báo cáo */}
        <Form.Item
          label="Tên báo cáo"
          name="name"
          rules={[{ required: true, message: "Nhập tên báo cáo" }]}
        >
          <Input />
        </Form.Item>

        {/* Loại file */}
        <Form.Item
          label="Loại file"
          name="type"
          rules={[{ required: true, message: "Chọn loại file" }]}
        >
          <Select>
            {types.map((t) => (
              <Option key={t} value={t}>{t}</Option>
            ))}
          </Select>
        </Form.Item>

        {/* Phòng ban */}
        <Form.Item
          label="Phòng ban"
          name="department"
          rules={[{ required: true, message: "Chọn phòng ban" }]}
        >
          <Select>
            {departments.map((d) => (
              <Option key={d} value={d}>{d}</Option>
            ))}
          </Select>
        </Form.Item>

        {/* Upload chỉ hiển thị với Tĩnh */}
        {mode === "Tĩnh" && (
          <Form.Item label="Upload file báo cáo">
            <Upload
              beforeUpload={() => false} // ngăn auto upload
              multiple
              listType="text"
            >
              <Button icon={<UploadOutlined />}>Kéo/thả hoặc chọn file</Button>
            </Upload>
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default AddReportModal;
