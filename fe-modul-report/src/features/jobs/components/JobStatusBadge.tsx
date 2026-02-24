import { Tag } from "antd";
import {
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { JobStatusType } from "../types/job";

const statusConfig: Record<JobStatusType, { color: string; icon: React.ReactNode; label: string }> = {
  pending: { color: "default", icon: <ClockCircleOutlined />, label: "Chờ xử lý" },
  running: { color: "processing", icon: <SyncOutlined spin />, label: "Đang chạy" },
  completed: { color: "success", icon: <CheckCircleOutlined />, label: "Hoàn thành" },
  failed: { color: "error", icon: <CloseCircleOutlined />, label: "Thất bại" },
};

interface Props {
  status: JobStatusType;
}

export default function JobStatusBadge({ status }: Props) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Tag color={config.color} icon={config.icon}>
      {config.label}
    </Tag>
  );
}
