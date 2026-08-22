import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Space,
  Table,
  Tabs,
  Typography,
  message,
} from "antd";
import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import ingestionApi from "../api/ingestionApi";
import type { BronzeObject, ProcessingJob, SecurityLabel } from "../types/ingestion";
import {
  JobStatusTag,
  ObjectStatusTag,
  SecurityLabelTag,
  formatBytes,
  formatTime,
} from "./statusTags";

const { Paragraph, Text } = Typography;

interface Props {
  objectId: string | null;
  labels: SecurityLabel[];
  onClose: () => void;
}

export default function ObjectDetailDrawer({ objectId, labels, onClose }: Props) {
  const [object, setObject] = useState<BronzeObject | null>(null);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [artifactContent, setArtifactContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!objectId) return;
    setLoading(true);
    try {
      const [detail, jobPage] = await Promise.all([
        ingestionApi.getObject(objectId),
        ingestionApi.listJobs({ object_id: objectId, size: 50 }),
      ]);
      setObject(detail);
      setJobs(jobPage.items);
    } finally {
      setLoading(false);
    }
  }, [objectId]);

  useEffect(() => {
    setObject(null);
    setJobs([]);
    setArtifactContent({});
    load();
  }, [load]);

  const label = labels.find((l) => l.id === object?.security_label_id);

  const showArtifact = async (artifactId: string) => {
    if (artifactContent[artifactId]) return;
    const detail = await ingestionApi.getArtifactContent(artifactId);
    setArtifactContent((prev) => ({ ...prev, [artifactId]: detail.content }));
  };

  const reprocess = async () => {
    if (!object) return;
    await ingestionApi.processObject(object.object_id, "BRONZE_EXTRACT");
    message.success("Đã đưa vào hàng đợi xử lý lại");
    load();
  };

  return (
    <Drawer
      title={object?.original_name ?? "Chi tiết đối tượng"}
      width={860}
      open={Boolean(objectId)}
      onClose={onClose}
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Làm mới
          </Button>
          <Button onClick={reprocess} disabled={!object}>
            Xử lý lại
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            disabled={
              !object || ["QUARANTINED", "REJECTED", "UPLOADING"].includes(object.status)
            }
            onClick={() =>
              object && ingestionApi.downloadObject(object.object_id, object.original_name)
            }
          >
            Tải xuống
          </Button>
        </Space>
      }
    >
      {!object ? (
        <Empty description="Đang tải" />
      ) : (
        <>
          {object.status_reason && (
            <Alert
              className="mb-4"
              type={object.status === "REJECTED" ? "error" : "warning"}
              showIcon
              message={object.status_reason}
            />
          )}

          <Tabs
            items={[
              {
                key: "meta",
                label: "Metadata",
                children: (
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="Trạng thái">
                      <ObjectStatusTag status={object.status} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Nhãn bảo mật">
                      <SecurityLabelTag label={label} />
                    </Descriptions.Item>
                    <Descriptions.Item label="SHA-256" span={2}>
                      <Text code copyable>
                        {object.sha256}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="MIME (server phát hiện)">
                      {object.mime_detected}
                    </Descriptions.Item>
                    <Descriptions.Item label="Dung lượng">
                      {formatBytes(object.size_bytes)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Loại tài liệu">
                      {object.document_type}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phiên bản hiện tại">
                      v{object.current_version_no}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mục đích" span={2}>
                      {object.purpose}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">{object.created_by}</Descriptions.Item>
                    <Descriptions.Item label="Thời điểm">
                      {formatTime(object.created_at)}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: "versions",
                label: `Phiên bản (${object.versions?.length ?? 0})`,
                children: (
                  <Table
                    size="small"
                    rowKey="version_id"
                    pagination={false}
                    dataSource={object.versions ?? []}
                    columns={[
                      { title: "Phiên bản", dataIndex: "version_no", render: (v) => `v${v}` },
                      {
                        title: "SHA-256",
                        dataIndex: "sha256",
                        render: (v: string) => <Text code>{v.slice(0, 16)}…</Text>,
                      },
                      {
                        title: "Dung lượng",
                        dataIndex: "size_bytes",
                        render: (v: number) => formatBytes(v),
                      },
                      { title: "MIME", dataIndex: "mime_detected" },
                      { title: "Người tạo", dataIndex: "created_by" },
                      {
                        title: "Thời điểm",
                        dataIndex: "created_at",
                        render: (v: string) => formatTime(v),
                      },
                    ]}
                  />
                ),
              },
              {
                key: "artifacts",
                label: `Artifact (${object.artifacts?.length ?? 0})`,
                children: (
                  <Space direction="vertical" className="w-full">
                    <Table
                      size="small"
                      rowKey="artifact_id"
                      pagination={false}
                      dataSource={object.artifacts ?? []}
                      columns={[
                        { title: "Tầng", dataIndex: "layer" },
                        { title: "Loại", dataIndex: "kind" },
                        { title: "Sinh bởi", dataIndex: "producer" },
                        {
                          title: "Dung lượng",
                          dataIndex: "size_bytes",
                          render: (v: number) => formatBytes(v),
                        },
                        {
                          title: "",
                          key: "action",
                          render: (_, row) => (
                            <Button
                              size="small"
                              onClick={() => showArtifact(row.artifact_id)}
                            >
                              Xem
                            </Button>
                          ),
                        },
                      ]}
                    />
                    {Object.entries(artifactContent).map(([id, content]) => (
                      <Paragraph key={id} className="bg-gray-50 p-3 rounded max-h-80 overflow-auto">
                        <pre className="whitespace-pre-wrap text-xs m-0">{content}</pre>
                      </Paragraph>
                    ))}
                  </Space>
                ),
              },
              {
                key: "jobs",
                label: `Job (${jobs.length})`,
                children: (
                  <Table
                    size="small"
                    rowKey="job_id"
                    pagination={false}
                    dataSource={jobs}
                    columns={[
                      { title: "Loại", dataIndex: "job_type" },
                      {
                        title: "Trạng thái",
                        dataIndex: "status",
                        render: (v) => <JobStatusTag status={v} />,
                      },
                      {
                        title: "Lần thử",
                        key: "attempt",
                        render: (_, row) => `${row.attempt}/${row.max_attempts}`,
                      },
                      { title: "Lỗi", dataIndex: "error_message", ellipsis: true },
                      {
                        title: "Kết thúc",
                        dataIndex: "finished_at",
                        render: (v: string) => formatTime(v),
                      },
                    ]}
                  />
                ),
              },
              {
                key: "scans",
                label: `Quét mã độc (${object.scans?.length ?? 0})`,
                children: (
                  <Table
                    size="small"
                    rowKey="scan_id"
                    pagination={false}
                    dataSource={object.scans ?? []}
                    columns={[
                      { title: "Scanner", dataIndex: "scanner" },
                      { title: "Phiên bản", dataIndex: "scanner_version" },
                      { title: "Kết luận", dataIndex: "verdict" },
                      { title: "Chữ ký", dataIndex: "signature" },
                      {
                        title: "Thời điểm",
                        dataIndex: "scanned_at",
                        render: (v: string) => formatTime(v),
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        </>
      )}
    </Drawer>
  );
}
