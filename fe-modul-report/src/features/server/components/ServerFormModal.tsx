import { Modal, Form, Input, InputNumber, Switch, Select } from "antd";
import { useEffect } from "react";
import type { SyncConnectionConfig, SyncConnectionConfigRequest, DatabaseType } from "../types/server";

const DATABASE_TYPE_OPTIONS: { value: DatabaseType; label: string }[] = [
  { value: "SQLSERVER", label: "SQL Server" },
  { value: "POSTGRESQL", label: "PostgreSQL" },
  { value: "MYSQL", label: "MySQL" },
  { value: "ORACLE", label: "Oracle" },
];

interface Props {
  open: boolean;
  server: SyncConnectionConfig | null;
  loading: boolean;
  onClose: () => void;
  onSave: (data: SyncConnectionConfigRequest) => void;
}

export default function ServerFormModal({ open, server, loading, onClose, onSave }: Props) {
  const [form] = Form.useForm();
  const isEdit = !!server;

  useEffect(() => {
    if (open && server) {
      form.setFieldsValue({
        host: server.host,
        databaseName: server.databaseName,
        port: server.port,
        username: server.username,
        databaseType: server.databaseType,
        timeoutSeconds: server.timeoutSeconds,
        active: server.active ?? true,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, server, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSave(values as SyncConnectionConfigRequest);
    } catch {
      // validation failed
    }
  };

  return (
    <Modal
      title={isEdit ? "Sửa kết nối Database" : "Thêm kết nối Database"}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText={isEdit ? "Cập nhật" : "Thêm"}
      cancelText="Huỷ"
      width={520}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
        initialValues={{ port: 1433, databaseType: "SQLSERVER", active: true }}
      >
        <div className="flex gap-4">
          <Form.Item
            name="host"
            label="Host / IP"
            className="flex-1"
            rules={[{ required: true, message: "Vui lòng nhập host" }]}
          >
            <Input placeholder="VD: 192.168.1.100 hoặc 118.70.151.69" />
          </Form.Item>

          <Form.Item
            name="port"
            label="Port"
            className="w-28"
            rules={[{ required: true, message: "Nhập port" }]}
          >
            <InputNumber min={1} max={65535} className="w-full" />
          </Form.Item>
        </div>

        <Form.Item
          name="databaseName"
          label="Tên Database"
          rules={[{ required: true, message: "Vui lòng nhập tên database" }]}
        >
          <Input placeholder="VD: EFS_2022, vinacomin_db" />
        </Form.Item>

        <div className="flex gap-4">
          <Form.Item
            name="username"
            label="Username"
            className="flex-1"
            rules={[{ required: true, message: "Vui lòng nhập username" }]}
          >
            <Input placeholder="VD: sa, admin" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            className="flex-1"
            rules={isEdit ? [] : [{ required: true, message: "Vui lòng nhập password" }]}
          >
            <Input.Password placeholder={isEdit ? "Bỏ trống nếu không thay đổi" : "Nhập password"} />
          </Form.Item>
        </div>

        <Form.Item
          name="databaseType"
          label="Loại Database"
          rules={[{ required: true, message: "Vui lòng chọn loại DB" }]}
        >
          <Select options={DATABASE_TYPE_OPTIONS} />
        </Form.Item>

        <div className="flex gap-8">
          <Form.Item name="timeoutSeconds" label="Timeout (giây)">
            <InputNumber min={1} max={86400} placeholder="VD: 30" className="w-full" />

          </Form.Item>

          <Form.Item name="active" label="Kích hoạt" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
