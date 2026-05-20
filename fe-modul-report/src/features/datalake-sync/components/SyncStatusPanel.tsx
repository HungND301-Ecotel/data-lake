import { Card, Descriptions, Tag, Button, Space, Alert, Spin } from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { SyncStatus } from "../types/sync";

interface SyncStatusPanelProps {
  status: SyncStatus | null;
  loading: boolean;
  onStart: () => Promise<{ success: boolean }>;
  onStop: () => Promise<{ success: boolean }>;
  onTrigger: () => Promise<{ success: boolean }>;
}

const SyncStatusPanel: React.FC<SyncStatusPanelProps> = ({
  status,
  loading,
  onStart,
  onStop,
  onTrigger,
}) => {
  if (!status && loading) {
    return (
      <Card title="Trạng thái đồng bộ">
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Trạng thái đồng bộ"
      extra={
        <Space>
          {status?.is_running ? (
            <Button
              danger
              icon={<PauseCircleOutlined />}
              onClick={onStop}
              loading={loading}
            >
              Dừng
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={onStart}
              loading={loading}
            >
              Bắt đầu
            </Button>
          )}
          <Button
            icon={<SyncOutlined />}
            onClick={onTrigger}
            loading={loading}
          >
            Đồng bộ ngay
          </Button>
        </Space>
      }
    >
      <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
        <Descriptions.Item label="Trạng thái">
          <Tag
            icon={
              status?.is_running ? (
                <CheckCircleOutlined />
              ) : (
                <CloseCircleOutlined />
              )
            }
            color={status?.is_running ? "processing" : "default"}
          >
            {status?.is_running ? "Đang chạy" : "Đã dừng"}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Chu kỳ (phút)">
          {status?.interval_minutes || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Bảng giám sát">
          {status?.tables_monitored?.join(", ") || "Tất cả"}
        </Descriptions.Item>
        <Descriptions.Item label="Số lần đồng bộ">
          {status?.sync_count?.toLocaleString() || 0}
        </Descriptions.Item>
        <Descriptions.Item label="Tổng bản ghi">
          {status?.records_synced_total?.toLocaleString() || 0}
        </Descriptions.Item>
        <Descriptions.Item label="Lần đồng bộ gần nhất">
          {status?.last_sync
            ? new Date(status.last_sync).toLocaleString("vi-VN")
            : "Chưa có"}
        </Descriptions.Item>
        <Descriptions.Item label="Lần tiếp theo">
          {status?.next_sync
            ? new Date(status.next_sync).toLocaleString("vi-VN")
            : "N/A"}
        </Descriptions.Item>
      </Descriptions>

      {status?.recent_errors && status.recent_errors.length > 0 && (
        <div className="mt-4">
          {status.recent_errors.map((err, index) => (
            <Alert
              key={index}
              message={err}
              type="error"
              showIcon
              className="mb-2"
            />
          ))}
        </div>
      )}
    </Card>
  );
};

export default SyncStatusPanel;
