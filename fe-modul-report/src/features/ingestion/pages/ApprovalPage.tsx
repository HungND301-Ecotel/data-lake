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
import { ReloadOutlined } from "@ant-design/icons";
import approvalApi, {
  type ApprovalRequest,
  type ApprovalStatus,
  type ApprovalWorkflow,
  type LegalHold,
  type RetentionSweep,
} from "../api/approvalApi";
import { formatTime } from "../components/statusTags";
import { useHasPermission } from "../../../stores/authStore";

const { Text, Paragraph } = Typography;

const STATUS_COLOR: Record<ApprovalStatus, string> = {
  PENDING: "processing",
  APPROVED: "green",
  REJECTED: "red",
  CANCELLED: "default",
  STALE: "orange",
};

const STATUS_HINT: Record<ApprovalStatus, string> = {
  PENDING: "Đang chờ quyết định",
  APPROVED: "Đã duyệt, chờ áp dụng",
  REJECTED: "Đã từ chối",
  CANCELLED: "Người yêu cầu đã huỷ",
  STALE: "Tài nguyên đã đổi sau khi duyệt — phải xin duyệt lại",
};

export default function ApprovalPage() {
  const canDecide = useHasPermission("approval.decide");
  const canAdmin = useHasPermission("admin.manage");

  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);
  const [holds, setHolds] = useState<LegalHold[]>([]);
  const [sweep, setSweep] = useState<RetentionSweep | null>(null);
  const [detail, setDetail] = useState<ApprovalRequest | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, matrix, holdList] = await Promise.all([
        approvalApi.list(),
        approvalApi.workflows(),
        approvalApi.holds(),
      ]);
      setRequests(list.items);
      setWorkflows(matrix.items);
      setHolds(holdList.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = (record: ApprovalRequest, approved: boolean) => {
    let note = "";
    Modal.confirm({
      title: approved
        ? `Duyệt ${record.action} cho ${record.resource_ref}?`
        : `Từ chối ${record.action} cho ${record.resource_ref}?`,
      width: 560,
      content: (
        <Space direction="vertical" className="w-full">
          <Text type="secondary">
            Quyết định của bạn được gắn với ảnh chụp bằng chứng
            {" "}
            <Text code>{record.snapshot_checksum.slice(0, 12)}…</Text>. Nếu tài nguyên
            thay đổi sau đó, phê duyệt này tự mất hiệu lực.
          </Text>
          <Input.TextArea
            rows={3}
            placeholder="Ghi chú quyết định"
            onChange={(e) => (note = e.target.value)}
          />
        </Space>
      ),
      okText: approved ? "Duyệt" : "Từ chối",
      okButtonProps: { danger: !approved },
      cancelText: "Huỷ",
      onOk: async () => {
        try {
          await approvalApi.decide(record.id, approved, note);
          message.success("Đã ghi quyết định");
          await load();
        } catch (error) {
          message.error(readError(error, "Không ghi được quyết định"));
          throw error;
        }
      },
    });
  };

  const releaseHold = (hold: LegalHold) => {
    let reason = "";
    Modal.confirm({
      title: `Gỡ legal hold ${hold.case_ref}?`,
      content: (
        <Space direction="vertical" className="w-full">
          <Text type="secondary">
            Người đặt hold không tự gỡ được. Sau khi gỡ, hồ sơ lại chịu chính sách lưu
            trữ bình thường.
          </Text>
          <Input.TextArea
            rows={3}
            placeholder="Lý do gỡ (bắt buộc)"
            onChange={(e) => (reason = e.target.value)}
          />
        </Space>
      ),
      okText: "Gỡ",
      cancelText: "Huỷ",
      onOk: async () => {
        try {
          await approvalApi.releaseHold(hold.id, reason);
          message.success("Đã gỡ");
          await load();
        } catch (error) {
          message.error(readError(error, "Không gỡ được"));
          throw error;
        }
      },
    });
  };

  const runSweep = async (execute: boolean) => {
    try {
      setSweep(await approvalApi.retentionSweep(execute));
    } catch (error) {
      message.error(readError(error, "Không rà soát được"));
    }
  };

  const pending = requests.filter((r) => r.status === "PENDING");

  return (
    <div className="space-y-4">
      <Card
        title="Phê duyệt & quản trị vòng đời"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Làm mới
            </Button>
            {canAdmin && (
              <Button
                onClick={async () => {
                  const result = await approvalApi.slaSweep();
                  message.info(`Đã đánh dấu leo thang ${result.escalated} yêu cầu`);
                  await load();
                }}
              >
                Rà soát quá hạn
              </Button>
            )}
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Mỗi quyết định gắn với đúng trạng thái mà người duyệt đã xem."
          description="Nếu tài nguyên thay đổi sau khi duyệt, phê duyệt chuyển sang STALE và phải xin lại — đó là thứ ngăn việc duyệt một bản vô hại rồi tráo bản khác. Một phê duyệt chỉ dùng được cho đúng một lần thay đổi."
        />

        <Tabs
          items={[
            {
              key: "pending",
              label: `Chờ quyết định (${pending.length})`,
              children: (
                <RequestTable
                  rows={pending}
                  loading={loading}
                  canDecide={canDecide}
                  onOpen={async (row) => setDetail(await approvalApi.get(row.id))}
                  onDecide={decide}
                />
              ),
            },
            {
              key: "all",
              label: `Tất cả (${requests.length})`,
              children: (
                <RequestTable
                  rows={requests}
                  loading={loading}
                  canDecide={false}
                  onOpen={async (row) => setDetail(await approvalApi.get(row.id))}
                  onDecide={decide}
                />
              ),
            },
            {
              key: "holds",
              label: `Legal hold (${holds.filter((h) => h.active).length})`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  dataSource={holds}
                  locale={{ emptyText: <Empty description="Không có legal hold nào" /> }}
                  columns={[
                    { title: "Vụ việc", dataIndex: "case_ref", width: 160 },
                    { title: "Tài nguyên", dataIndex: "resource_ref" },
                    { title: "Lý do", dataIndex: "reason", ellipsis: true },
                    { title: "Người đặt", dataIndex: "placed_by", width: 130 },
                    {
                      title: "Đặt lúc",
                      dataIndex: "placed_at",
                      width: 170,
                      render: formatTime,
                    },
                    {
                      title: "Trạng thái",
                      dataIndex: "active",
                      width: 120,
                      render: (active: boolean, row) =>
                        active ? (
                          <Tooltip title="Hồ sơ này không bị huỷ theo retention">
                            <Tag color="red">đang giữ</Tag>
                          </Tooltip>
                        ) : (
                          <Tooltip title={row.release_reason ?? undefined}>
                            <Tag>đã gỡ</Tag>
                          </Tooltip>
                        ),
                    },
                    {
                      title: "",
                      key: "actions",
                      width: 100,
                      render: (_, row) =>
                        canDecide && row.active ? (
                          <Button size="small" onClick={() => releaseHold(row)}>
                            Gỡ
                          </Button>
                        ) : null,
                    },
                  ]}
                />
              ),
            },
            {
              key: "retention",
              label: "Retention",
              children: (
                <Space direction="vertical" className="w-full">
                  <Paragraph type="secondary">
                    Rà soát không tự huỷ gì. Hồ sơ đang bị legal hold luôn được bỏ qua,
                    và hồ sơ còn lại vẫn cần một yêu cầu huỷ đã được duyệt.
                  </Paragraph>
                  <Space>
                    <Button onClick={() => runSweep(false)}>Rà soát thử</Button>
                    {canAdmin && (
                      <Button danger onClick={() => runSweep(true)}>
                        Thực thi
                      </Button>
                    )}
                  </Space>

                  {sweep && (
                    <>
                      <Space wrap>
                        {Object.entries(sweep.summary).map(([outcome, count]) => (
                          <Tag key={outcome} color={OUTCOME_COLOR[outcome] ?? "default"}>
                            {OUTCOME_LABEL[outcome] ?? outcome}: {count}
                          </Tag>
                        ))}
                      </Space>
                      <Table
                        rowKey="object_id"
                        size="small"
                        dataSource={sweep.items}
                        columns={[
                          { title: "Hồ sơ", dataIndex: "original_name" },
                          { title: "Chính sách", dataIndex: "policy", width: 150 },
                          {
                            title: "Hết hạn",
                            dataIndex: "due_at",
                            width: 170,
                            render: formatTime,
                          },
                          {
                            title: "Kết quả",
                            dataIndex: "outcome",
                            width: 200,
                            render: (outcome: string, row) => (
                              <Tooltip title={row.detail}>
                                <Tag color={OUTCOME_COLOR[outcome] ?? "default"}>
                                  {OUTCOME_LABEL[outcome] ?? outcome}
                                </Tag>
                              </Tooltip>
                            ),
                          },
                        ]}
                      />
                    </>
                  )}
                </Space>
              ),
            },
            {
              key: "matrix",
              label: `Ma trận (${workflows.length})`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  dataSource={workflows}
                  columns={[
                    { title: "Loại tài nguyên", dataIndex: "resource_type", width: 170 },
                    { title: "Thao tác", dataIndex: "action" },
                    {
                      title: "Số người duyệt",
                      dataIndex: "required_approvals",
                      width: 140,
                    },
                    {
                      title: "Vai trò được duyệt",
                      dataIndex: "approver_roles",
                      render: (roles: string[]) => (
                        <Space size={4} wrap>
                          {roles.map((role) => (
                            <Tag key={role}>{role}</Tag>
                          ))}
                        </Space>
                      ),
                    },
                    {
                      title: "Bốn mắt",
                      dataIndex: "four_eyes",
                      width: 100,
                      render: (value: boolean) =>
                        value ? <Tag color="green">bật</Tag> : <Tag color="red">tắt</Tag>,
                    },
                    { title: "SLA (giờ)", dataIndex: "sla_hours", width: 110 },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        open={!!detail}
        width={860}
        title={detail ? `${detail.action} · ${detail.resource_ref}` : ""}
        onClose={() => setDetail(null)}
      >
        {detail && (
          <Space direction="vertical" className="w-full">
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="Trạng thái">
                <Tooltip title={STATUS_HINT[detail.status]}>
                  <Tag color={STATUS_COLOR[detail.status]}>{detail.status}</Tag>
                </Tooltip>
              </Descriptions.Item>
              <Descriptions.Item label="Tiến độ">
                {detail.approvals_done}/{detail.required_approvals}
              </Descriptions.Item>
              <Descriptions.Item label="Người yêu cầu">
                {detail.requested_by}
              </Descriptions.Item>
              <Descriptions.Item label="Hạn SLA">
                {formatTime(detail.sla_due_at)}
                {detail.escalated_at && <Tag color="orange">đã leo thang</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="Lý do" span={2}>
                {detail.reason}
              </Descriptions.Item>
              <Descriptions.Item label="Ảnh chụp" span={2}>
                <Text code>{detail.snapshot_checksum}</Text>
              </Descriptions.Item>
            </Descriptions>

            {detail.status === "STALE" && (
              <Alert
                type="warning"
                showIcon
                message="Tài nguyên đã thay đổi kể từ khi được duyệt."
                description="Phê duyệt này không còn dùng được; phải tạo yêu cầu mới trên trạng thái hiện tại."
              />
            )}

            <Card size="small" title="Bằng chứng đã khoá">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(detail.snapshot, null, 2)}
              </pre>
            </Card>

            <Table
              rowKey={(_, index) => String(index)}
              size="small"
              dataSource={detail.steps ?? []}
              locale={{ emptyText: <Empty description="Chưa ai quyết định" /> }}
              columns={[
                {
                  title: "Quyết định",
                  dataIndex: "decision",
                  width: 120,
                  render: (decision: string) => (
                    <Tag color={decision === "APPROVE" ? "green" : "red"}>{decision}</Tag>
                  ),
                },
                { title: "Người quyết định", dataIndex: "approver", width: 150 },
                { title: "Vai trò", dataIndex: "approver_roles", width: 170 },
                { title: "Ghi chú", dataIndex: "note" },
                {
                  title: "Lúc",
                  dataIndex: "decided_at",
                  width: 170,
                  render: formatTime,
                },
              ]}
            />
          </Space>
        )}
      </Drawer>
    </div>
  );
}

const OUTCOME_LABEL: Record<string, string> = {
  DUE: "đến hạn",
  SKIPPED_LEGAL_HOLD: "bỏ qua vì legal hold",
  BLOCKED_NEEDS_APPROVAL: "chờ phê duyệt huỷ",
  ARCHIVED: "đã đưa vào lưu trữ",
};

const OUTCOME_COLOR: Record<string, string> = {
  DUE: "blue",
  SKIPPED_LEGAL_HOLD: "red",
  BLOCKED_NEEDS_APPROVAL: "orange",
  ARCHIVED: "green",
};

function RequestTable({
  rows,
  loading,
  canDecide,
  onOpen,
  onDecide,
}: {
  rows: ApprovalRequest[];
  loading: boolean;
  canDecide: boolean;
  onOpen: (row: ApprovalRequest) => void;
  onDecide: (row: ApprovalRequest, approved: boolean) => void;
}) {
  return (
    <Table
      rowKey="id"
      size="small"
      loading={loading}
      dataSource={rows}
      onRow={(row) => ({ onClick: () => onOpen(row) })}
      rowClassName="cursor-pointer"
      locale={{ emptyText: <Empty description="Không có yêu cầu nào" /> }}
      columns={[
        {
          title: "Thao tác",
          dataIndex: "action",
          width: 190,
          render: (action: string, row) => (
            <Space direction="vertical" size={0}>
              <Text strong>{action}</Text>
              <Text type="secondary" className="text-xs">
                {row.resource_ref}
              </Text>
            </Space>
          ),
        },
        { title: "Lý do", dataIndex: "reason", ellipsis: true },
        { title: "Người yêu cầu", dataIndex: "requested_by", width: 140 },
        {
          title: "Tiến độ",
          key: "progress",
          width: 100,
          render: (_, row) => `${row.approvals_done}/${row.required_approvals}`,
        },
        {
          title: "Trạng thái",
          dataIndex: "status",
          width: 150,
          render: (status: ApprovalStatus, row) => (
            <Space size={4}>
              <Tooltip title={STATUS_HINT[status]}>
                <Tag color={STATUS_COLOR[status]}>{status}</Tag>
              </Tooltip>
              {row.escalated_at && (
                <Tooltip title="Quá hạn SLA">
                  <Tag color="orange">quá hạn</Tag>
                </Tooltip>
              )}
            </Space>
          ),
        },
        ...(canDecide
          ? [
              {
                title: "",
                key: "actions",
                width: 170,
                render: (_: unknown, row: ApprovalRequest) => (
                  <Space onClick={(e) => e.stopPropagation()}>
                    <Button size="small" type="primary" onClick={() => onDecide(row, true)}>
                      Duyệt
                    </Button>
                    <Button size="small" danger onClick={() => onDecide(row, false)}>
                      Từ chối
                    </Button>
                  </Space>
                ),
              },
            ]
          : []),
      ]}
    />
  );
}

function readError(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { error?: { message?: string } } } })
    ?.response?.data?.error?.message;
  return detail || fallback;
}
