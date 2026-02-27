import { Card, Form, Input, InputNumber, Button, message } from "antd";
import { CloudServerOutlined, PlayCircleOutlined } from "@ant-design/icons";

interface LiveImportFormProps {
  onImport: (
    database: string,
    tables: string[] | null,
    rowLimit: number
  ) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
}

const LiveImportForm: React.FC<LiveImportFormProps> = ({
  onImport,
  loading,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: {
    database: string;
    tables?: string;
    rowLimit: number;
  }) => {
    const tables = values.tables
      ? values.tables.split(",").map((t) => t.trim()).filter(Boolean)
      : null;

    const result = await onImport(values.database, tables, values.rowLimit);
    if (result.success) {
      message.success("Import dữ liệu thành công");
    } else {
      message.error(result.error || "Import thất bại");
    }
  };

  return (
    <Card
      title={
        <span>
          <CloudServerOutlined className="mr-2" />
          Import từ Live Database
        </span>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ rowLimit: 1000 }}
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
          label="Bảng (phân tách bằng dấu phẩy, để trống để lấy tất cả)"
        >
          <Input placeholder="VD: Orders, Customers, Products" />
        </Form.Item>

        <Form.Item
          name="rowLimit"
          label="Giới hạn dòng mỗi bảng"
          rules={[{ required: true }]}
        >
          <InputNumber min={100} max={100000} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<PlayCircleOutlined />}
            loading={loading}
            block
          >
            Import dữ liệu
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default LiveImportForm;
