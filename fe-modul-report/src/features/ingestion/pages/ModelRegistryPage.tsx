import { useCallback, useEffect, useState } from "react";
import { Alert, Button, Card, Popconfirm, Space, Table, Tag, Tooltip, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import aiChatApi, { type ChatModelInfo } from "../api/aiChatApi";

const APPROVAL_COLOR: Record<string, string> = {
  APPROVED: "green",
  EXPERIMENTAL: "gold",
  SUSPENDED: "red",
};

/**
 * Model registry - mục 6.2. Mức độ mật tối đa của một triển khai quyết định
 * loại dữ liệu nào được đưa vào mô hình đó, nên bảng này là một mặt quản trị
 * an toàn thông tin chứ không chỉ là cấu hình kỹ thuật.
 */
export default function ModelRegistryPage() {
  const [models, setModels] = useState<ChatModelInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setModels((await aiChatApi.listModels()).items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setApproval = async (
    model: ChatModelInfo,
    status: "APPROVED" | "SUSPENDED" | "EXPERIMENTAL"
  ) => {
    await aiChatApi.setModelApproval(model.id, status);
    message.success("Đã cập nhật trạng thái phê duyệt");
    load();
  };

  return (
    <Card
      title="Model registry"
      extra={
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          Làm mới
        </Button>
      }
    >
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message="Dữ liệu miền C chỉ được xử lý bởi mô hình chạy trong AI enclave nội bộ."
        description="Mô hình bên ngoài không thể được cấp mức độ mật từ 3 trở lên. Phê duyệt một mô hình đòi hỏi phải khai báo bộ đánh giá."
      />

      <Table
        rowKey="id"
        loading={loading}
        dataSource={models}
        pagination={false}
        columns={[
          {
            title: "Mô hình",
            key: "model",
            render: (_, row) => (
              <Space direction="vertical" size={0}>
                <strong>{row.model_id}</strong>
                <span className="text-xs text-gray-500">
                  {row.provider} · {row.version}
                </span>
              </Space>
            ),
          },
          {
            title: "Vị trí",
            dataIndex: "is_internal",
            width: 150,
            render: (value: boolean) =>
              value ? (
                <Tag color="green">AI enclave nội bộ</Tag>
              ) : (
                <Tag color="orange">Nhà cung cấp ngoài</Tag>
              ),
          },
          {
            title: "Mức độ mật tối đa",
            dataIndex: "max_security_level",
            width: 160,
            render: (value: number) => (
              <Tooltip title="Mức phân loại cao nhất mà mô hình này được phép xử lý">
                <Tag color={value >= 3 ? "red" : "blue"}>{value}</Tag>
              </Tooltip>
            ),
          },
          {
            title: "Năng lực",
            dataIndex: "capabilities",
            render: (value: string[]) => value.map((c) => <Tag key={c}>{c}</Tag>),
          },
          {
            title: "Bộ đánh giá",
            dataIndex: "evaluation_set",
            render: (value: string | null) =>
              value || <span className="text-gray-400">chưa khai báo</span>,
          },
          {
            title: "Phê duyệt",
            dataIndex: "approval_status",
            width: 150,
            render: (value: string) => <Tag color={APPROVAL_COLOR[value]}>{value}</Tag>,
          },
          {
            title: "",
            key: "action",
            width: 200,
            render: (_, row) => (
              <Space>
                {row.approval_status !== "APPROVED" && (
                  <Popconfirm
                    title="Phê duyệt mô hình này cho sử dụng?"
                    onConfirm={() => setApproval(row, "APPROVED")}
                  >
                    <Button size="small" type="primary">
                      Phê duyệt
                    </Button>
                  </Popconfirm>
                )}
                {row.approval_status === "APPROVED" && (
                  <Popconfirm
                    title="Đình chỉ mô hình? Các yêu cầu đang định tuyến tới đây sẽ bị từ chối."
                    onConfirm={() => setApproval(row, "SUSPENDED")}
                  >
                    <Button size="small" danger>
                      Đình chỉ
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}
