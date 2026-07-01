import { Card, Typography, Tag } from "antd";
import { CodeOutlined } from "@ant-design/icons";
import { useSyncStatus } from "../hooks/useSyncStatus";
import { useTenant } from "../../../config/tenant";
import { useHealthCheck } from "../../datalake/hooks/useHealthCheck";
import SyncStatusPanel from "../components/SyncStatusPanel";
import SyncConfigForm from "../components/SyncConfigForm";
import SystemStatusCard from "../../datalake/components/SystemStatusCard";

const { Text } = Typography;

const SyncSettingsPage: React.FC = () => {
  const { tenant } = useTenant();
  const { status, loading, start, stop, trigger, updateConfig } =
    useSyncStatus();
  const { healthStatus, readyStatus, loading: healthLoading } =
    useHealthCheck();

  const endpoints = [
    { method: "POST", endpoint: "/api/v1/chat/", description: "Gửi tin nhắn chat" },
    { method: "GET", endpoint: "/api/v1/data/status", description: "Trạng thái dữ liệu" },
    { method: "POST", endpoint: "/api/v1/charts/generate", description: "Tạo biểu đồ" },
    { method: "GET", endpoint: "/api/v1/sync/status", description: "Trạng thái đồng bộ" },
  ];

  const methodColor: Record<string, string> = {
    GET: "green",
    POST: "blue",
    PUT: "orange",
    DELETE: "red",
  };

  return (
    <div className="space-y-4">
      <SyncStatusPanel
        status={status}
        loading={loading}
        onStart={start}
        onStop={stop}
        onTrigger={trigger}
      />

      <SyncConfigForm config={status} onSave={updateConfig} loading={loading} />

      <SystemStatusCard
        healthStatus={healthStatus}
        readyStatus={readyStatus}
        loading={healthLoading}
      />

      {/* API Documentation */}
      <Card
        title={
          <span>
            <CodeOutlined className="mr-2" />
            API Documentation
          </span>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {endpoints.map((ep, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <Tag color={methodColor[ep.method]}>{ep.method}</Tag>
              <div className="flex-1 min-w-0">
                <Text code className="text-sm block truncate">
                  {ep.endpoint}
                </Text>
                <Text type="secondary" className="text-xs">
                  {ep.description}
                </Text>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-4">
          <a
            href={`${tenant.apiTarget}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            Swagger UI →
          </a>
          <a
            href={`${tenant.apiTarget}/redoc`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            ReDoc →
          </a>
        </div>
      </Card>
    </div>
  );
};

export default SyncSettingsPage;
