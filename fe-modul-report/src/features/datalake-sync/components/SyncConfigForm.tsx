import { Card, Form, Input, InputNumber, Button, message } from "antd";
import { SettingOutlined, SaveOutlined } from "@ant-design/icons";
import { useEffect } from "react";
import type { SyncStatus } from "../types/sync";
import type { SyncConfigRequest } from "../types/sync";

interface SyncConfigFormProps {
  config: SyncStatus | null;
  onSave: (config: SyncConfigRequest) => Promise<{ success: boolean }>;
  loading: boolean;
}

const SyncConfigForm: React.FC<SyncConfigFormProps> = ({
  config,
  onSave,
  loading,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        database: config.database || "",
        tables: config.tables_monitored?.join(", ") || "",
        interval_minutes: config.interval_minutes || 5,
        timestamp_column: config.timestamp_column || "updated_at",
      });
    }
  }, [config, form]);

  const handleSubmit = async (values: {
    database: string;
    tables: string;
    interval_minutes: number;
    timestamp_column: string;
  }) => {
    const tables = values.tables
      ? values.tables.split(",").map((t) => t.trim()).filter(Boolean)
      : null;

    const result = await onSave({
      database: values.database,
      tables,
      interval_minutes: values.interval_minutes,
      timestamp_column: values.timestamp_column,
    });

    if (result.success) {
      message.success("Cập nhật cấu hình thành công");
    } else {
      message.error("Cập nhật thất bại");
    }
  };

  return (
    <Card
      title={
        <span>
          <SettingOutlined className="mr-2" />
          Cấu hình đồng bộ
        </span>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="database"
          label="Tên Database"
          rules={[{ required: true, message: "Vui lòng nhập tên database" }]}
        >
          <Input placeholder="VD: WolvesTeam" />
        </Form.Item>

        <Form.Item
          name="tables"
          label="Bảng giám sát (phân tách bằng dấu phẩy, để trống cho tất cả)"
        >
          <Input placeholder="VD: Orders, Customers" />
        </Form.Item>

        <Form.Item
          name="interval_minutes"
          label="Chu kỳ đồng bộ (phút)"
          rules={[{ required: true }]}
        >
          <InputNumber min={1} max={1440} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="timestamp_column"
          label="Cột timestamp (để phát hiện thay đổi)"
          rules={[{ required: true }]}
        >
          <Input placeholder="VD: updated_at" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={loading}
          >
            Lưu cấu hình
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default SyncConfigForm;
