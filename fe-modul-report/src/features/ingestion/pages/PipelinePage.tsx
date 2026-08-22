import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { ReloadOutlined, ThunderboltOutlined } from "@ant-design/icons";
import pipelineApi, {
  type BackfillRow,
  type PipelineRow,
  type RunRow,
  type RunStatus,
  type TaskRunRow,
} from "../api/pipelineApi";
import { formatTime } from "../components/statusTags";
import { useHasPermission } from "../../../stores/authStore";

const { Text, Paragraph } = Typography;

const RUN_COLOR: Record<RunStatus, string> = {
  PENDING: "default",
  RUNNING: "processing",
  SUCCEEDED: "green",
  FAILED: "red",
  CANCELLED: "orange",
  SKIPPED: "default",
};

const BACKFILL_COLOR: Record<string, string> = {
  DRAFT: "default",
  AWAITING_APPROVAL: "gold",
  READY: "blue",
  RUNNING: "processing",
  COMPLETED: "green",
  CANCELLED: "default",
};

export default function PipelinePage() {
  const canRun = useHasPermission("pipeline.execute");
  const canAdmin = useHasPermission("admin.manage");

  const [pipelines, setPipelines] = useState<PipelineRow[]>([]);
  const [backfills, setBackfills] = useState<BackfillRow[]>([]);
  const [detail, setDetail] = useState<PipelineRow | null>(null);
  const [runs, setRuns] = useState<RunRow[]>([]);
  const [run, setRun] = useState<RunRow | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, planned] = await Promise.all([
        pipelineApi.list(),
        pipelineApi.backfills(),
      ]);
      setPipelines(list.items);
      setBackfills(planned.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (row: PipelineRow) => {
    setDetail(await pipelineApi.get(row.code));
    setRuns((await pipelineApi.runs(row.code)).items);
  };

  const cancel = (record: RunRow) => {
    let reason = "";
    Modal.confirm({
      title: `Huỷ lần chạy ${record.id.slice(0, 8)}?`,
      content: (
        <Space direction="vertical" className="w-full">
          <Text type="secondary">
            Lệnh huỷ có hiệu lực ở checkpoint kế tiếp, không cắt giữa chừng. Task đã
            commit vẫn giữ output; task đang dở bị bỏ hẳn.
          </Text>
          <Input.TextArea
            rows={3}
            placeholder="Lý do (bắt buộc)"
            onChange={(e) => (reason = e.target.value)}
          />
        </Space>
      ),
      okText: "Yêu cầu huỷ",
      okButtonProps: { danger: true },
      cancelText: "Đóng",
      onOk: async () => {
        await pipelineApi.cancel(record.id, reason);
        if (detail) setRuns((await pipelineApi.runs(detail.code)).items);
      },
    });
  };

  const reprocess = (record: RunRow) => {
    let reason = "";
    Modal.confirm({
      title: "Chạy lại cùng đầu vào?",
      content: (
        <Space direction="vertical" className="w-full">
          <Text type="secondary">
            Chạy lại tạo một lần chạy mới có chủ đích — khác với việc trigger bắn
            trùng, vốn chỉ trả về đúng lần chạy cũ.
          </Text>
          <Input.TextArea
            rows={3}
            placeholder="Vì sao chạy lại? (bắt buộc)"
            onChange={(e) => (reason = e.target.value)}
          />
        </Space>
      ),
      okText: "Chạy lại",
      cancelText: "Huỷ",
      onOk: async () => {
        await pipelineApi.reprocess(record.id, reason);
        if (detail) setRuns((await pipelineApi.runs(detail.code)).items);
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card
        title="Pipeline"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Làm mới
            </Button>
            {canAdmin && (
              <Button
                onClick={async () => {
                  const result = await pipelineApi.slaSweep();
                  message.info(`${result.breached} lần chạy quá SLA`);
                  await load();
                }}
              >
                Rà soát SLA
              </Button>
            )}
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Mỗi lần chạy ghi lại checksum của DAG và digest của worker image."
          description="Nhờ vậy một kết quả luôn truy được về đúng đoạn code đã sinh ra nó, kể cả khi phiên bản pipeline đã bị thay. Gọi lại cùng đầu vào trả về đúng lần chạy cũ; muốn chạy lại thật thì dùng Chạy lại và nêu lý do."
        />

        <Tabs
          items={[
            {
              key: "pipelines",
              label: `Pipeline (${pipelines.length})`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  loading={loading}
                  dataSource={pipelines}
                  onRow={(row) => ({ onClick: () => open(row) })}
                  rowClassName="cursor-pointer"
                  locale={{ emptyText: <Empty description="Chưa có pipeline nào" /> }}
                  columns={[
                    {
                      title: "Mã",
                      dataIndex: "code",
                      render: (value: string, row) => (
                        <Space direction="vertical" size={0}>
                          <Text strong>{value}</Text>
                          <Text type="secondary" className="text-xs">
                            {row.name}
                          </Text>
                        </Space>
                      ),
                    },
                    { title: "Chủ sở hữu", dataIndex: "owner_user", width: 150 },
                    {
                      title: "Bản đang chạy",
                      dataIndex: "published_version",
                      width: 140,
                      render: (version: number | null) =>
                        version ? (
                          <Tag color="green">v{version}</Tag>
                        ) : (
                          <Text type="secondary">chưa công bố</Text>
                        ),
                    },
                    { title: "Lịch", dataIndex: "schedule", width: 130 },
                    {
                      title: "SLA",
                      dataIndex: "sla_minutes",
                      width: 100,
                      render: (value: number | null) => (value ? `${value} phút` : "—"),
                    },
                  ]}
                />
              ),
            },
            {
              key: "backfills",
              label: `Backfill (${backfills.length})`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  dataSource={backfills}
                  locale={{ emptyText: <Empty description="Chưa có backfill nào" /> }}
                  columns={[
                    { title: "Pipeline", dataIndex: "pipeline_code", width: 190 },
                    {
                      title: "Cửa sổ",
                      key: "window",
                      render: (_, row) => `${row.window_from} → ${row.window_to}`,
                    },
                    {
                      title: "Số lần chạy",
                      key: "runs",
                      width: 150,
                      render: (_, row) => (
                        <Tooltip title={`Quota của phiên bản: ${row.quota_runs}`}>
                          <Text>
                            {row.planned_runs}
                            {row.requires_approval ? " (vượt quota)" : ""}
                          </Text>
                        </Tooltip>
                      ),
                    },
                    { title: "Lý do", dataIndex: "reason", ellipsis: true },
                    {
                      title: "Trạng thái",
                      dataIndex: "status",
                      width: 190,
                      render: (status: string, row) => (
                        <Space direction="vertical" size={0}>
                          <Tag color={BACKFILL_COLOR[status] ?? "default"}>{status}</Tag>
                          {row.approval_request_id && (
                            <Text type="secondary" className="text-xs">
                              cần phê duyệt
                            </Text>
                          )}
                        </Space>
                      ),
                    },
                    {
                      title: "",
                      key: "actions",
                      width: 110,
                      render: (_, row) =>
                        canRun && ["READY", "AWAITING_APPROVAL"].includes(row.status) ? (
                          <Button
                            size="small"
                            icon={<ThunderboltOutlined />}
                            onClick={async () => {
                              try {
                                const result = await pipelineApi.executeBackfill(row.id);
                                message.success(
                                  `Đã mở ${result.runs.length} lần chạy`
                                );
                                await load();
                              } catch (error) {
                                message.error(
                                  readError(error, "Chưa chạy được backfill")
                                );
                              }
                            }}
                          >
                            Chạy
                          </Button>
                        ) : null,
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        open={!!detail}
        width={960}
        title={detail ? `${detail.code} · ${detail.name}` : ""}
        onClose={() => setDetail(null)}
      >
        {detail && (
          <Tabs
            items={[
              {
                key: "runs",
                label: `Lần chạy (${runs.length})`,
                children: (
                  <Table
                    rowKey="id"
                    size="small"
                    dataSource={runs}
                    onRow={(row) => ({
                      onClick: async () => setRun(await pipelineApi.run(row.id)),
                    })}
                    rowClassName="cursor-pointer"
                    columns={[
                      {
                        title: "Bắt đầu",
                        dataIndex: "started_at",
                        width: 175,
                        render: formatTime,
                      },
                      { title: "Đầu vào", dataIndex: "input_ref", width: 150 },
                      {
                        title: "Nguồn kích hoạt",
                        dataIndex: "trigger",
                        width: 130,
                        render: (trigger: string) => <Tag>{trigger}</Tag>,
                      },
                      {
                        title: "Trạng thái",
                        dataIndex: "status",
                        width: 190,
                        render: (status: RunStatus, row) => (
                          <Space size={4} wrap>
                            <Tag color={RUN_COLOR[status]}>{status}</Tag>
                            {row.cancel_requested && status !== "CANCELLED" && (
                              <Tooltip title="Sẽ dừng ở checkpoint kế tiếp">
                                <Tag color="orange">đang huỷ</Tag>
                              </Tooltip>
                            )}
                            {row.sla_breached && <Tag color="red">quá SLA</Tag>}
                          </Space>
                        ),
                      },
                      {
                        title: "Phiên bản code",
                        dataIndex: "code_version",
                        width: 150,
                        render: (value: string) => (
                          <Tooltip title={value}>
                            <Text code className="text-xs">
                              {value.slice(0, 12)}…
                            </Text>
                          </Tooltip>
                        ),
                      },
                      {
                        title: "",
                        key: "actions",
                        width: 180,
                        render: (_, row) =>
                          canRun ? (
                            <Space onClick={(e) => e.stopPropagation()}>
                              {["PENDING", "RUNNING"].includes(row.status) && (
                                <Button size="small" danger onClick={() => cancel(row)}>
                                  Huỷ
                                </Button>
                              )}
                              {["FAILED", "CANCELLED", "SUCCEEDED"].includes(
                                row.status
                              ) && (
                                <Button size="small" onClick={() => reprocess(row)}>
                                  Chạy lại
                                </Button>
                              )}
                            </Space>
                          ) : null,
                      },
                    ]}
                  />
                ),
              },
              {
                key: "versions",
                label: `Phiên bản (${detail.versions?.length ?? 0})`,
                children: (
                  <Space direction="vertical" className="w-full">
                    <Paragraph type="secondary">
                      Một phiên bản chỉ công bố được khi đã ghim worker image bằng
                      digest — chạy một tag di động làm dấu vết code trở nên vô nghĩa.
                    </Paragraph>
                    {(detail.versions ?? []).map((version) => (
                      <Card
                        key={version.version}
                        size="small"
                        title={
                          <Space>
                            <Text strong>v{version.version}</Text>
                            <Tag
                              color={
                                version.status === "PUBLISHED"
                                  ? "green"
                                  : version.status === "RETIRED"
                                  ? "default"
                                  : "blue"
                              }
                            >
                              {version.status}
                            </Tag>
                          </Space>
                        }
                        extra={
                          canRun && version.status === "DRAFT" ? (
                            <Button
                              size="small"
                              onClick={async () => {
                                try {
                                  await pipelineApi.publishVersion(
                                    detail.code,
                                    version.version
                                  );
                                  message.success("Đã công bố");
                                  await open(detail);
                                  await load();
                                } catch (error) {
                                  message.error(
                                    readError(error, "Chưa công bố được")
                                  );
                                }
                              }}
                            >
                              Công bố
                            </Button>
                          ) : null
                        }
                      >
                        <Descriptions size="small" column={2}>
                          <Descriptions.Item label="Checksum DAG">
                            <Text code className="text-xs">
                              {version.definition_checksum.slice(0, 16)}…
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Worker image">
                            {version.worker_image_digest ? (
                              <Text code className="text-xs">
                                {version.worker_image}
                              </Text>
                            ) : (
                              <Text type="danger">chưa ghim digest</Text>
                            )}
                          </Descriptions.Item>
                          <Descriptions.Item label="SLA">
                            {version.sla_minutes ? `${version.sla_minutes} phút` : "—"}
                          </Descriptions.Item>
                          <Descriptions.Item label="Quota backfill">
                            {version.backfill_quota_runs}
                          </Descriptions.Item>
                        </Descriptions>
                        <Table
                          rowKey="name"
                          size="small"
                          pagination={false}
                          dataSource={version.definition.tasks ?? []}
                          columns={[
                            { title: "Task", dataIndex: "name" },
                            { title: "Handler", dataIndex: "handler" },
                            {
                              title: "Phụ thuộc",
                              dataIndex: "depends_on",
                              render: (depends: string[] | undefined) =>
                                depends?.length ? depends.join(", ") : "—",
                            },
                          ]}
                        />
                      </Card>
                    ))}
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Drawer>

      <Drawer
        open={!!run}
        width={820}
        title={run ? `Lần chạy ${run.id.slice(0, 8)}` : ""}
        onClose={() => setRun(null)}
      >
        {run && (
          <Space direction="vertical" className="w-full">
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="Trạng thái">
                <Tag color={RUN_COLOR[run.status]}>{run.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Đầu vào">{run.input_ref ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="Phiên bản code" span={2}>
                <Text code className="text-xs">{run.code_version}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Worker image" span={2}>
                <Text code className="text-xs">{run.worker_image_digest ?? "—"}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Khoá idempotency" span={2}>
                <Text code className="text-xs">{run.idempotency_key}</Text>
              </Descriptions.Item>
              {run.cancel_reason && (
                <Descriptions.Item label="Lý do huỷ" span={2}>
                  {run.cancel_reason}
                </Descriptions.Item>
              )}
              {run.error && (
                <Descriptions.Item label="Lỗi" span={2}>
                  <Text type="danger">{run.error}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Table
              rowKey="task_name"
              size="small"
              dataSource={run.tasks ?? []}
              columns={[
                { title: "Task", dataIndex: "task_name" },
                {
                  title: "Phụ thuộc",
                  dataIndex: "depends_on",
                  render: (depends: string[]) => depends.join(", ") || "—",
                },
                {
                  title: "Trạng thái",
                  dataIndex: "status",
                  width: 130,
                  render: (status: RunStatus) => (
                    <Tag color={RUN_COLOR[status]}>{status}</Tag>
                  ),
                },
                {
                  title: "Lần thử",
                  key: "attempt",
                  width: 100,
                  render: (_, row: TaskRunRow) => `${row.attempt}/${row.max_attempts}`,
                },
                {
                  title: "Output",
                  dataIndex: "output_ref",
                  render: (value: string | null) =>
                    value ? (
                      <Text code className="text-xs">
                        {value}
                      </Text>
                    ) : (
                      <Text type="secondary">—</Text>
                    ),
                },
              ]}
            />

            <Card size="small" title={`Checkpoint (${run.checkpoints?.length ?? 0})`}>
              <Table
                rowKey="sequence"
                size="small"
                pagination={false}
                dataSource={run.checkpoints ?? []}
                locale={{ emptyText: <Empty description="Chưa có checkpoint nào" /> }}
                columns={[
                  { title: "#", dataIndex: "sequence", width: 60 },
                  { title: "Nhãn", dataIndex: "label" },
                  {
                    title: "Lúc",
                    dataIndex: "created_at",
                    width: 175,
                    render: formatTime,
                  },
                ]}
              />
            </Card>
          </Space>
        )}
      </Drawer>
    </div>
  );
}

function readError(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { error?: { message?: string } } } })
    ?.response?.data?.error?.message;
  return detail || fallback;
}
