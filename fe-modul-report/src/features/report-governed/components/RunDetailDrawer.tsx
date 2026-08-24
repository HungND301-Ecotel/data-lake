import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Descriptions,
  Drawer,
  Empty,
  Input,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { DownloadOutlined, EyeOutlined } from "@ant-design/icons";
import governedReportApi, {
  type ReportNarrative,
  type ReportRun,
} from "../api/governedReportApi";

const { Text, Paragraph } = Typography;

function formatTime(value?: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "—";
}

interface Props {
  runId: string | null;
  onClose: () => void;
  onChanged: () => void;
}

export default function RunDetailDrawer({ runId, onClose, onChanged }: Props) {
  const [run, setRun] = useState<ReportRun | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!runId) return;
    setLoading(true);
    try {
      setRun(await governedReportApi.getRun(runId));
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    setRun(null);
    load();
  }, [load]);

  const openPreview = async () => {
    if (!run) return;
    const blob = await governedReportApi.preview(run.id);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `preview-${run.definitionCode}-${run.periodEnd}.docx`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const act = async (action: () => Promise<unknown>, success: string) => {
    await action();
    message.success(success);
    await load();
    onChanged();
  };

  return (
    <Drawer
      title={run?.title ?? "Chi tiết báo cáo"}
      width={960}
      open={Boolean(runId)}
      onClose={onClose}
      extra={
        run && (
          <Space>
            <Button icon={<EyeOutlined />} onClick={openPreview}>
              Xem trước
            </Button>
            {run.status === "DRAFT" && (
              <Button
                type="primary"
                onClick={() =>
                  act(() => governedReportApi.submit(run.id), "Đã trình duyệt")
                }
              >
                Trình duyệt
              </Button>
            )}
            {run.status === "PENDING_APPROVAL" && (
              <>
                <Button
                  danger
                  onClick={() => {
                    const note = window.prompt("Lý do từ chối (bắt buộc)") || "";
                    if (!note.trim()) {
                      message.warning("Từ chối phải kèm lý do");
                      return;
                    }
                    act(
                      () => governedReportApi.decide(run.id, "REJECT", note),
                      "Đã từ chối"
                    );
                  }}
                >
                  Từ chối
                </Button>
                <Button
                  type="primary"
                  onClick={() =>
                    act(
                      () =>
                        governedReportApi.decide(
                          run.id,
                          "APPROVE",
                          window.prompt("Ghi chú phê duyệt") || undefined
                        ),
                      "Đã phê duyệt"
                    )
                  }
                >
                  Phê duyệt
                </Button>
              </>
            )}
            {(run.status === "APPROVED" || run.status === "EXPORTED") && (
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={() =>
                  act(() => governedReportApi.export(run.id), "Đã phát hành")
                }
              >
                Phát hành
              </Button>
            )}
          </Space>
        )
      }
    >
      {!run ? (
        <Empty description={loading ? "Đang tải" : "Không có dữ liệu"} />
      ) : (
        <>
          {run.warnings.length > 0 && (
            <Alert
              type="warning"
              showIcon
              className="mb-4"
              message="Cảnh báo khi sinh báo cáo"
              description={
                <ul className="m-0 pl-4">
                  {run.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              }
            />
          )}

          <Tabs
            items={[
              {
                key: "info",
                label: "Thông tin",
                children: (
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="Trạng thái">{run.status}</Descriptions.Item>
                    <Descriptions.Item label="Kỳ">
                      {run.periodStart} → {run.periodEnd}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mẫu">
                      v{run.templateVersionNo}
                    </Descriptions.Item>
                    <Descriptions.Item label="Nhãn bảo mật">
                      <Tag color={(run.securityLevel ?? 0) >= 3 ? "red" : "blue"}>
                        {run.securityLabelCode ?? "—"} · mức {run.securityLevel}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Mã kiểm chứng số liệu" span={2}>
                      <Text code copyable>
                        {run.snapshotChecksum}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Chốt số liệu lúc">
                      {formatTime(run.snapshotAt)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mô hình AI">
                      {run.aiModelId
                        ? `${run.aiModelId} ${run.aiModelVersion ?? ""}`
                        : "không dùng"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phiên bản prompt">
                      {run.aiPromptVersion ?? "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người tạo">{run.createdBy}</Descriptions.Item>
                    <Descriptions.Item label="Người trình">
                      {run.submittedBy ?? "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người duyệt">
                      {run.approvedBy ?? "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ghi chú duyệt" span={2}>
                      {run.decisionNote ?? "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Tệp phát hành" span={2}>
                      {run.artifactFileKey ?? "chưa phát hành"}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: "facts",
                label: `Số liệu đã chốt (${run.facts.length})`,
                children: (
                  <Table
                    rowKey="code"
                    size="small"
                    pagination={false}
                    dataSource={run.facts}
                    columns={[
                      { title: "Mã", dataIndex: "code", width: 70 },
                      { title: "Placeholder", dataIndex: "placeholderName", width: 200 },
                      {
                        title: "Giá trị",
                        key: "value",
                        render: (_, row) =>
                          row.factType === "TABLE" ? (
                            <Tag>{row.value}</Tag>
                          ) : (
                            <Text strong>
                              {row.value} {row.unit ?? ""}
                            </Text>
                          ),
                      },
                      {
                        title: "Nguồn",
                        key: "source",
                        render: (_, row) => (
                          <Tooltip
                            title={`Cột ${row.sourceColumn ?? "—"}, dòng ${
                              row.sourceRowIndex ?? 0
                            } trong ${row.sourceRowCount ?? 0} dòng trả về`}
                          >
                            <Text className="text-xs">
                              {row.dataQueryCode} v{row.dataQueryVersion}
                            </Text>
                          </Tooltip>
                        ),
                      },
                      {
                        title: "Chạy lúc",
                        dataIndex: "executedAt",
                        width: 170,
                        render: formatTime,
                      },
                    ]}
                  />
                ),
              },
              {
                key: "narratives",
                label: `Nhận xét (${run.narratives.length})`,
                children: (
                  <Space direction="vertical" className="w-full" size="middle">
                    {run.narratives.length === 0 && <Empty description="Không có mục AI" />}
                    {run.narratives.map((narrative) => (
                      <NarrativeCard
                        key={narrative.id}
                        narrative={narrative}
                        editable={run.status === "DRAFT"}
                        onSaved={async () => {
                          await load();
                          onChanged();
                        }}
                      />
                    ))}
                  </Space>
                ),
              },
            ]}
          />
        </>
      )}
    </Drawer>
  );
}

function NarrativeCard({
  narrative,
  editable,
  onSaved,
}: {
  narrative: ReportNarrative;
  editable: boolean;
  onSaved: () => void;
}) {
  const [text, setText] = useState(narrative.finalText ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setText(narrative.finalText ?? "");
  }, [narrative.finalText]);

  const warnings: string[] = (() => {
    try {
      return narrative.warnings ? JSON.parse(narrative.warnings) : [];
    } catch {
      return [];
    }
  })();

  return (
    <div className="border border-gray-200 rounded p-3">
      <Space className="mb-2" wrap>
        <Text strong>{narrative.placeholderName}</Text>
        {narrative.blocked && <Tag color="red">Bị chặn</Tag>}
        {narrative.modelId && <Tag>{narrative.modelId}</Tag>}
        {narrative.factCodes && (
          <Tooltip title="Số liệu đã chốt mà đoạn văn này dựa vào">
            <Tag color="green">facts: {narrative.factCodes}</Tag>
          </Tooltip>
        )}
        {narrative.editedBy && <Tag color="gold">đã sửa tay</Tag>}
      </Space>

      {warnings.length > 0 && (
        <Alert
          type="warning"
          className="mb-2"
          message={
            <ul className="m-0 pl-4">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          }
        />
      )}

      {editable ? (
        <Space direction="vertical" className="w-full">
          <Input.TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoSize={{ minRows: 3, maxRows: 10 }}
          />
          <Button
            size="small"
            type="primary"
            loading={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await governedReportApi.editNarrative(narrative.id, text);
                message.success("Đã lưu nhận xét");
                onSaved();
              } finally {
                setSaving(false);
              }
            }}
          >
            Lưu
          </Button>
        </Space>
      ) : (
        <Paragraph className="mb-0 whitespace-pre-wrap">
          {narrative.finalText || "(trống)"}
        </Paragraph>
      )}

      {narrative.generatedText && narrative.generatedText !== narrative.finalText && (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer">
            Bản gốc do mô hình sinh ra
          </summary>
          <Paragraph type="secondary" className="text-xs mt-1 mb-0 whitespace-pre-wrap">
            {narrative.generatedText}
          </Paragraph>
        </details>
      )}
    </div>
  );
}
