import { useEffect, useRef } from "react";
import { Progress, Steps, Card, Tag, Typography, List, Badge, Alert } from "antd";
import {
  DatabaseOutlined,
  ThunderboltOutlined,
  GoldOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { PipelinePhase, StreamLog } from "../types/dbLakehouse";

const { Text } = Typography;

interface PipelineProgressProps {
  progress: number;
  phase: PipelinePhase;
  message: string;
  logs: StreamLog[];
  streaming: boolean;
  error: string | null;
}

const PHASE_ORDER: PipelinePhase[] = ["bronze", "silver", "gold", "complete"];

function getStepStatus(stepPhase: PipelinePhase, currentPhase: PipelinePhase, error: string | null) {
  const stepIdx = PHASE_ORDER.indexOf(stepPhase);
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);

  if (error && currentPhase === "error") return "error";
  if (currentPhase === "complete" || stepIdx < currentIdx) return "finish";
  if (stepIdx === currentIdx) return "process";
  return "wait";
}

function getStepIcon(stepPhase: PipelinePhase, currentPhase: PipelinePhase, error: string | null) {
  const status = getStepStatus(stepPhase, currentPhase, error);
  if (status === "finish") return <CheckCircleOutlined />;
  if (status === "process") return <LoadingOutlined />;
  if (status === "error") return <CloseCircleOutlined />;
  return <ClockCircleOutlined />;
}

const phaseColors: Record<string, string> = {
  bronze: "orange",
  silver: "blue",
  gold: "gold",
  complete: "green",
  error: "red",
  idle: "default",
};

export default function PipelineProgress({ progress, phase, message, logs, streaming, error }: PipelineProgressProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (phase === "idle" && logs.length === 0) return null;

  const progressStatus = error ? "exception" : phase === "complete" ? "success" : "active";

  const steps = [
    { title: "Bronze", description: "Restore .bak", icon: <DatabaseOutlined />, phase: "bronze" as PipelinePhase },
    { title: "Silver", description: "Clean & Validate", icon: <ThunderboltOutlined />, phase: "silver" as PipelinePhase },
    { title: "Gold", description: "Chuẩn hóa", icon: <GoldOutlined />, phase: "gold" as PipelinePhase },
    { title: "Hoàn tất", description: "Pipeline done", icon: <CheckCircleOutlined />, phase: "complete" as PipelinePhase },
  ];

  return (
    <Card size="small" className="mb-4">
      <Steps
        size="small"
        className="mb-4"
        items={steps.map((s) => ({
          title: s.title,
          description: s.description,
          icon: getStepIcon(s.phase, phase, error),
          status: getStepStatus(s.phase, phase, error) as "wait" | "process" | "finish" | "error",
        }))}
      />

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Tag color={phaseColors[phase] || "default"}>
            {phase === "idle" ? "Chờ" : phase.toUpperCase()}
          </Tag>
          {streaming && <Badge status="processing" text="Đang xử lý..." />}
          <Text className="flex-1" ellipsis>{message}</Text>
        </div>
        <Progress
          percent={Math.round(progress)}
          status={progressStatus}
          strokeColor={
            phase === "bronze" ? "#fa8c16"
            : phase === "silver" ? "#1890ff"
            : phase === "gold" ? "#faad14"
            : phase === "complete" ? "#52c41a"
            : undefined
          }
        />
      </div>

      {error && <Alert message={error} type="error" className="mb-3" showIcon />}

      <Card
        size="small"
        title={<Text type="secondary">Nhật ký xử lý ({logs.length} events)</Text>}
        styles={{ body: { maxHeight: 250, overflowY: "auto", padding: "4px 12px" } }}
      >
        <List
          size="small"
          dataSource={logs}
          renderItem={(log) => (
            <List.Item className="py-1! px-0! border-0!">
              <div className="flex items-center gap-2 w-full text-xs">
                <Tag
                  color={phaseColors[log.phase] || "default"}
                  className="text-xs min-w-[60px] text-center"
                >
                  {log.phase}
                </Tag>
                <Tag className="text-xs">{Math.round(log.progress)}%</Tag>
                <Text className="flex-1 text-xs" ellipsis>
                  {log.message}
                </Text>
                {log.data?.table && (
                  <Tag color="cyan" className="text-xs">{log.data.table}</Tag>
                )}
                {log.data?.row_count !== undefined && (
                  <Text type="secondary" className="text-xs">{log.data.row_count?.toLocaleString()} rows</Text>
                )}
                <Text type="secondary" className="text-xs whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString("vi-VN")}
                </Text>
              </div>
            </List.Item>
          )}
        />
        <div ref={logEndRef} />
      </Card>
    </Card>
  );
}
