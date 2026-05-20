import { Card, Descriptions, Tag, Spin } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { HealthStatus, ReadyStatus } from "../types/datalake";

interface SystemStatusCardProps {
  healthStatus: HealthStatus | null;
  readyStatus: ReadyStatus | null;
  loading?: boolean;
}

const SystemStatusCard: React.FC<SystemStatusCardProps> = ({
  healthStatus,
  readyStatus,
  loading = false,
}) => {
  if (loading) {
    return (
      <Card title="Trạng thái hệ thống">
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <span>
          <InfoCircleOutlined className="mr-2" />
          Trạng thái hệ thống
        </span>
      }
    >
      <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
        <Descriptions.Item label="API Status">
          <StatusTag
            ok={healthStatus?.status === "healthy"}
            label={healthStatus?.status || "Đang kiểm tra..."}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Version">
          {healthStatus?.version || "N/A"}
        </Descriptions.Item>
        <Descriptions.Item label="Vector Store">
          <StatusTag
            ok={readyStatus?.checks?.vector_store_loaded}
            label={
              readyStatus?.checks?.vector_store_loaded
                ? "Đã tải"
                : "Chưa tải"
            }
          />
        </Descriptions.Item>
        <Descriptions.Item label="LLM">
          <StatusTag
            ok={readyStatus?.checks?.llm_configured}
            label={
              readyStatus?.checks?.llm_configured
                ? "Đã cấu hình"
                : "Chưa cấu hình"
            }
          />
        </Descriptions.Item>
        <Descriptions.Item label="Hệ thống">
          <StatusTag
            ok={readyStatus?.ready}
            label={readyStatus?.ready ? "Sẵn sàng" : "Chưa sẵn sàng"}
          />
        </Descriptions.Item>
        <Descriptions.Item label="Số tài liệu">
          {readyStatus?.checks?.document_count?.toLocaleString() || "0"}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

function StatusTag({ ok, label }: { ok?: boolean; label: string }) {
  return (
    <Tag
      icon={ok ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
      color={ok ? "success" : "error"}
    >
      {label}
    </Tag>
  );
}

export default SystemStatusCard;
