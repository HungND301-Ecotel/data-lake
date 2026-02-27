import { Modal, Form, Input, InputNumber, Switch, Select } from "antd";
import { useEffect } from "react";
import type { ServerConfig, ServerCreateRequest, ServerUpdateRequest } from "../types/server";

interface Props {
  open: boolean;
  server: ServerConfig | null;
  loading: boolean;
  onClose: () => void;
  onSave: (data: ServerCreateRequest | ServerUpdateRequest) => void;
}

export default function ServerFormModal({ open, server, loading, onClose, onSave }: Props) {
  const [form] = Form.useForm();
  const isEdit = !!server;

  useEffect(() => {
    if (open && server) {
      form.setFieldsValue({
        name: server.name,
        host: server.host,
        port: server.port,
        username: server.username,
        driver: server.driver,
        trust_cert: server.trust_cert,
        windows_auth: server.windows_auth,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, server, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSave(values);
    } catch {
      // validation failed
    }
  };

  return (
    <Modal
      title={isEdit ? "Sửa Server" : "Thêm Server"}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      okText={isEdit ? "Cập nhật" : "Thêm"}
      cancelText="Huỷ"
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4" initialValues={{ port: 1433, username: "sa", driver: "{ODBC Driver 18 for SQL Server}", trust_cert: true, windows_auth: false }}>
        <Form.Item name="name" label="Tên Server" rules={[{ required: true, message: "Vui lòng nhập tên server" }]}>
          <Input placeholder="VD: Production Server" />
        </Form.Item>

        <Form.Item name="host" label="Host / IP" rules={[{ required: true, message: "Vui lòng nhập host" }]}>
          <Input placeholder="VD: 192.168.1.100 hoặc localhost\SQLEXPRESS" />
        </Form.Item>

        <div className="flex gap-4">
          <Form.Item name="port" label="Port" className="flex-1">
            <InputNumber min={1} max={65535} className="w-full" />
          </Form.Item>

          <Form.Item name="username" label="Username" className="flex-1">
            <Input placeholder="sa" />
          </Form.Item>
        </div>

        <Form.Item
          name="password"
          label="Password"
          rules={isEdit ? [] : [{ required: true, message: "Vui lòng nhập password" }]}
        >
          <Input.Password placeholder={isEdit ? "Bỏ trống nếu không thay đổi" : "Nhập password"} />
        </Form.Item>

        <Form.Item name="driver" label="ODBC Driver">
          <Select
            options={[
              { value: "{ODBC Driver 18 for SQL Server}", label: "ODBC Driver 18" },
              { value: "{ODBC Driver 17 for SQL Server}", label: "ODBC Driver 17" },
            ]}
          />
        </Form.Item>

        <div className="flex gap-8">
          <Form.Item name="trust_cert" label="Trust Certificate" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="windows_auth" label="Windows Auth" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
