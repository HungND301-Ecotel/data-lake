import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { PlusOutlined, ReloadOutlined, ThunderboltOutlined } from "@ant-design/icons";
import qualityApi, {
  type DatasetProfile,
  type DatasetQuality,
  type QualityIssue,
  type QualityResult,
  type QualityRule,
  type QualityRuleType,
  type SuggestedRule,
  type TrendPoint,
} from "../api/qualityApi";
import catalogApi, { type Dataset } from "../api/catalogApi";
import { formatTime } from "../components/statusTags";
import { useHasPermission } from "../../../stores/authStore";

const { Text, Paragraph } = Typography;

const RESULT_COLOR: Record<string, string> = {
  PASS: "green",
  FAIL: "red",
  UNKNOWN: "orange",
};

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "red",
  MAJOR: "orange",
  MINOR: "default",
};

const RULE_STATUS_COLOR: Record<string, string> = {
  DRAFT: "default",
  APPROVED: "green",
  RETIRED: "default",
};

/** Trường nào có nghĩa với loại rule nào — giữ form khớp với dịch vụ. */
const RULE_TYPES: { value: QualityRuleType; label: string; needsField: boolean }[] = [
  { value: "NOT_NULL", label: "NOT_NULL — không rỗng (đầy đủ)", needsField: true },
  { value: "UNIQUE", label: "UNIQUE — không trùng (duy nhất)", needsField: true },
  { value: "RANGE", label: "RANGE — trong khoảng (hợp lệ)", needsField: true },
  { value: "ENUM", label: "ENUM — thuộc danh mục (hợp lệ)", needsField: true },
  { value: "REGEX", label: "REGEX — đúng định dạng (hợp lệ)", needsField: true },
  { value: "COMPARE", label: "COMPARE — so với cột khác (nhất quán)", needsField: true },
  { value: "FRESHNESS", label: "FRESHNESS — độ tươi so với SLA", needsField: false },
  { value: "REFERENCE", label: "REFERENCE — tồn tại ở dataset khác", needsField: true },
];

export default function DataQualityPage() {
  const canManage = useHasPermission("quality.manage");

  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [quality, setQuality] = useState<DatasetQuality | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [form] = Form.useForm();
  const ruleType = Form.useWatch("rule_type", form);

  useEffect(() => {
    catalogApi.listDatasets({ size: 200 }).then((page) => {
      setDatasets(page.items);
      if (!selected && page.items.length) setSelected(page.items[0].code);
    });
    // Chỉ nạp một lần; việc chọn dataset do người dùng quyết định sau đó.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const load = useCallback(async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const [q, t] = await Promise.all([
        qualityApi.datasetQuality(selected),
        qualityApi.trend(selected),
      ]);
      setQuality(q);
      setTrend(t.points);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    setProfile(null);
    load();
  }, [load]);

  const fields = useMemo(
    () => (profile?.columns ?? []).map((c) => c.name),
    [profile]
  );

  const runNow = async () => {
    if (!selected) return;
    try {
      const run = await qualityApi.run(selected);
      message.success(
        `Điểm ${run.score} · ${run.passed} đạt / ${run.failed} hỏng / ${run.unknown} không xác định`
      );
      await load();
    } catch (error) {
      message.error(readError(error, "Không chạy được kiểm tra"));
    }
  };

  const runProfile = async () => {
    if (!selected) return;
    setProfile(await qualityApi.profile(selected));
  };

  const createRule = async (preset?: SuggestedRule) => {
    if (!selected) return;
    const values = preset
      ? { ...preset, dataset_code: selected, suggested: true }
      : { ...(await form.validateFields()), dataset_code: selected };

    if (!preset && values.config) {
      try {
        values.config = JSON.parse(values.config);
      } catch {
        message.error("Cấu hình phải là JSON hợp lệ");
        return;
      }
    }
    try {
      await qualityApi.createRule(values);
      message.success("Đã tạo rule ở trạng thái nháp, chờ chủ sở hữu duyệt ngưỡng");
      setRuleOpen(false);
      form.resetFields();
      await load();
    } catch (error) {
      message.error(readError(error, "Không tạo được rule"));
    }
  };

  const approve = async (rule: QualityRule) => {
    try {
      await qualityApi.approveRule(rule.code);
      message.success("Đã duyệt ngưỡng");
      await load();
    } catch (error) {
      message.error(readError(error, "Không duyệt được"));
    }
  };

  const waive = (rule: QualityRule) => {
    let reason = "";
    let approver = "";
    let expires = "";
    Modal.confirm({
      title: `Miễn trừ tạm thời cho ${rule.code}`,
      width: 520,
      content: (
        <Space direction="vertical" className="w-full">
          <Text type="secondary">
            Waiver phải có người duyệt, lý do và hạn. Hết hạn là tự động hết hiệu lực,
            không cần ai thu hồi.
          </Text>
          <Input placeholder="Người duyệt" onChange={(e) => (approver = e.target.value)} />
          <Input
            placeholder="Hết hạn (ISO, ví dụ 2026-12-31T00:00:00Z)"
            onChange={(e) => (expires = e.target.value)}
          />
          <Input.TextArea
            rows={3}
            placeholder="Lý do miễn trừ"
            onChange={(e) => (reason = e.target.value)}
          />
        </Space>
      ),
      okText: "Tạo waiver",
      cancelText: "Huỷ",
      onOk: async () => {
        await qualityApi.createWaiver(rule.code, {
          reason,
          approved_by: approver,
          expires_at: expires,
        });
        message.success("Đã tạo waiver");
        await load();
      },
    });
  };

  const resolve = (issue: QualityIssue) => {
    let note = "";
    Modal.confirm({
      title: `Đóng issue ${issue.rule_code}`,
      content: (
        <Input.TextArea
          rows={3}
          placeholder="Đã xử lý thế nào?"
          onChange={(e) => (note = e.target.value)}
        />
      ),
      okText: "Đóng",
      cancelText: "Huỷ",
      onOk: async () => {
        await qualityApi.resolveIssue(issue.id, note);
        message.success("Đã đóng issue");
        await load();
      },
    });
  };

  const gate = quality?.gate;
  const latest = quality?.latest_run;

  return (
    <div className="space-y-4">
      <Card
        title="Chất lượng dữ liệu"
        extra={
          <Space>
            <Select
              showSearch
              value={selected ?? undefined}
              onChange={setSelected}
              style={{ width: 280 }}
              placeholder="Chọn dataset"
              options={datasets.map((d) => ({
                value: d.code,
                label: `${d.code} · ${d.namespace}`,
              }))}
            />
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Làm mới
            </Button>
            {canManage && (
              <>
                <Button onClick={runProfile}>Profiling</Button>
                <Button icon={<ThunderboltOutlined />} onClick={runNow}>
                  Chạy kiểm tra
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setRuleOpen(true)}
                >
                  Thêm rule
                </Button>
              </>
            )}
          </Space>
        }
      >
        {gate && (
          <Alert
            className="mb-4"
            showIcon
            type={gate.allowed ? "success" : "error"}
            message={
              gate.allowed
                ? "Chất lượng cho phép công bố dataset này"
                : gate.message || "Chưa đủ điều kiện công bố"
            }
            description={
              <Space direction="vertical" size={2}>
                {!gate.allowed && gate.blocking?.length ? (
                  <Text>
                    Đang bị chặn bởi:{" "}
                    {gate.blocking.map((b) => (
                      <Tag key={b.rule} color="red">
                        {b.rule} · {b.status}
                      </Tag>
                    ))}
                  </Text>
                ) : null}
                {gate.waived?.length ? (
                  <Text type="secondary">
                    Đang được miễn trừ:{" "}
                    {gate.waived.map((w) => (
                      <Tooltip key={w.rule} title={`Hết hạn ${formatTime(w.expires_at)}`}>
                        <Tag color="gold">{w.rule}</Tag>
                      </Tooltip>
                    ))}
                  </Text>
                ) : null}
                {gate.low_confidence && (
                  <Text type="warning">
                    Mẫu dữ liệu nhỏ — các con số dưới đây chỉ mang tính tham khảo.
                  </Text>
                )}
              </Space>
            }
          />
        )}

        {latest && (
          <Row gutter={16} className="mb-4">
            <Col span={6}>
              <Card size="small">
                <Statistic title="Điểm chất lượng" value={latest.score ?? 0} suffix="/100" />
                <Progress
                  percent={latest.score ?? 0}
                  showInfo={false}
                  status={
                    (latest.score ?? 0) >= 90
                      ? "success"
                      : (latest.score ?? 0) >= 60
                      ? "normal"
                      : "exception"
                  }
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="Rule đạt" value={latest.passed} />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Hỏng / không xác định"
                  value={`${latest.failed} / ${latest.unknown}`}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic title="Số dòng đã soi" value={latest.row_count} />
                <Text type="secondary" className="text-xs">
                  {formatTime(latest.started_at)}
                </Text>
              </Card>
            </Col>
          </Row>
        )}

        <Tabs
          items={[
            {
              key: "rules",
              label: `Rule (${quality?.rules.length ?? 0})`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  loading={loading}
                  dataSource={quality?.rules ?? []}
                  locale={{
                    emptyText: (
                      <Empty description="Chưa có rule nào; dataset Gold sẽ không công bố được" />
                    ),
                  }}
                  columns={[
                    {
                      title: "Mã",
                      dataIndex: "code",
                      render: (value: string, row) => (
                        <Space direction="vertical" size={0}>
                          <Text strong>{value}</Text>
                          <Text type="secondary" className="text-xs">
                            {row.rule_type}
                            {row.field_name ? ` · ${row.field_name}` : ""}
                          </Text>
                        </Space>
                      ),
                    },
                    { title: "Chiều", dataIndex: "dimension", width: 170 },
                    {
                      title: "Mức",
                      dataIndex: "severity",
                      width: 110,
                      render: (severity: string) => (
                        <Tag color={SEVERITY_COLOR[severity]}>{severity}</Tag>
                      ),
                    },
                    {
                      title: "Ngưỡng",
                      dataIndex: "threshold",
                      width: 100,
                      render: (value: number) => `${(value * 100).toFixed(1)}%`,
                    },
                    {
                      title: "Trạng thái",
                      dataIndex: "status",
                      width: 200,
                      render: (status: string, row) => (
                        <Space size={4}>
                          <Tag color={RULE_STATUS_COLOR[status]}>{status}</Tag>
                          {row.approved_by && (
                            <Tooltip title={`Duyệt bởi ${row.approved_by}`}>
                              <Tag>4 mắt</Tag>
                            </Tooltip>
                          )}
                          {row.active_waiver && (
                            <Tooltip
                              title={`${row.active_waiver.reason} — hết hạn ${formatTime(
                                row.active_waiver.expires_at
                              )}`}
                            >
                              <Tag color="gold">waiver</Tag>
                            </Tooltip>
                          )}
                        </Space>
                      ),
                    },
                    {
                      title: "",
                      key: "actions",
                      width: 190,
                      render: (_, row) =>
                        canManage ? (
                          <Space>
                            {row.status === "DRAFT" && (
                              <Button size="small" onClick={() => approve(row)}>
                                Duyệt ngưỡng
                              </Button>
                            )}
                            {row.status === "APPROVED" && !row.active_waiver && (
                              <Button size="small" onClick={() => waive(row)}>
                                Miễn trừ
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
              key: "results",
              label: `Kết quả lần chạy gần nhất (${latest?.results?.length ?? 0})`,
              children: latest?.results ? (
                <>
                  {latest.score_recomputed !== undefined &&
                    latest.score_recomputed !== latest.score && (
                      <Alert
                        type="error"
                        showIcon
                        className="mb-3"
                        message="Điểm tính lại từ evidence không khớp điểm đã lưu"
                        description="Đây là dấu hiệu dữ liệu chấm điểm đã bị sửa ngoài luồng."
                      />
                    )}
                  <Table
                    rowKey="rule_code"
                    size="small"
                    dataSource={latest.results}
                    expandable={{
                      rowExpandable: (row: QualityResult) =>
                        row.evidence.length > 0 || !!row.error,
                      expandedRowRender: (row: QualityResult) => (
                        <Paragraph className="mb-0">
                          {row.error && <Text type="danger">{row.error}</Text>}
                          {row.evidence.length > 0 && (
                            <pre className="text-xs overflow-auto">
                              {JSON.stringify(row.evidence, null, 2)}
                            </pre>
                          )}
                        </Paragraph>
                      ),
                    }}
                    columns={[
                      { title: "Rule", dataIndex: "rule_code" },
                      { title: "Chiều", dataIndex: "dimension", width: 170 },
                      {
                        title: "Mức",
                        dataIndex: "severity",
                        width: 100,
                        render: (severity: string) => (
                          <Tag color={SEVERITY_COLOR[severity]}>{severity}</Tag>
                        ),
                      },
                      {
                        title: "Kết quả",
                        dataIndex: "status",
                        width: 140,
                        render: (status: string, row) => (
                          <Space size={4}>
                            <Tag color={RESULT_COLOR[status]}>{status}</Tag>
                            {row.waived && <Tag color="gold">miễn trừ</Tag>}
                          </Space>
                        ),
                      },
                      {
                        title: "Vi phạm",
                        key: "violating",
                        width: 160,
                        render: (_, row) =>
                          row.evaluated_rows
                            ? `${row.violating_rows}/${row.evaluated_rows} (${(
                                (row.observed_ratio ?? 0) * 100
                              ).toFixed(1)}%)`
                            : "—",
                      },
                      {
                        title: "Ngưỡng",
                        dataIndex: "threshold",
                        width: 100,
                        render: (value: number) => `${(value * 100).toFixed(1)}%`,
                      },
                    ]}
                  />
                </>
              ) : (
                <Empty description="Chưa chạy kiểm tra lần nào" />
              ),
            },
            {
              key: "issues",
              label: `Issue (${quality?.open_issues.length ?? 0})`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  dataSource={quality?.open_issues ?? []}
                  locale={{ emptyText: <Empty description="Không có issue nào đang mở" /> }}
                  columns={[
                    { title: "Rule", dataIndex: "rule_code" },
                    {
                      title: "Mức",
                      dataIndex: "severity",
                      width: 100,
                      render: (severity: string) => (
                        <Tag color={SEVERITY_COLOR[severity]}>{severity}</Tag>
                      ),
                    },
                    {
                      title: "Trạng thái",
                      dataIndex: "status",
                      width: 110,
                      render: (status: string) => (
                        <Tag color={status === "WAIVED" ? "gold" : "red"}>{status}</Tag>
                      ),
                    },
                    { title: "Chi tiết", dataIndex: "detail", ellipsis: true },
                    { title: "Chủ sở hữu", dataIndex: "owner_user", width: 140 },
                    { title: "Số lần", dataIndex: "occurrences", width: 80 },
                    {
                      title: "Gần nhất",
                      dataIndex: "last_seen_at",
                      width: 170,
                      render: formatTime,
                    },
                    {
                      title: "",
                      key: "actions",
                      width: 110,
                      render: (_, row) =>
                        canManage ? (
                          <Button size="small" onClick={() => resolve(row)}>
                            Đóng
                          </Button>
                        ) : null,
                    },
                  ]}
                />
              ),
            },
            {
              key: "trend",
              label: `Diễn biến (${trend.length})`,
              children: (
                <Table
                  rowKey="run_id"
                  size="small"
                  dataSource={[...trend].reverse()}
                  locale={{ emptyText: <Empty description="Chưa có lần chạy nào" /> }}
                  columns={[
                    {
                      title: "Thời điểm",
                      dataIndex: "started_at",
                      width: 180,
                      render: formatTime,
                    },
                    {
                      title: "Điểm",
                      dataIndex: "score",
                      width: 200,
                      render: (score: number | null) => (
                        <Progress percent={score ?? 0} size="small" />
                      ),
                    },
                    { title: "Đạt", dataIndex: "passed", width: 80 },
                    { title: "Hỏng", dataIndex: "failed", width: 80 },
                    { title: "Không xác định", dataIndex: "unknown", width: 130 },
                    {
                      title: "CRITICAL chưa đạt",
                      dataIndex: "critical_failed",
                      width: 160,
                      render: (value: number) =>
                        value ? <Tag color="red">{value}</Tag> : "—",
                    },
                    { title: "Số dòng", dataIndex: "row_count", width: 100 },
                  ]}
                />
              ),
            },
            {
              key: "profile",
              label: "Profiling",
              children: profile ? (
                <Space direction="vertical" className="w-full">
                  <Descriptions size="small" column={3} bordered>
                    <Descriptions.Item label="Số dòng">
                      {profile.row_count}
                    </Descriptions.Item>
                    <Descriptions.Item label="Lúc">
                      {formatTime(profile.profiled_at)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Độ tin cậy">
                      {profile.low_confidence ? (
                        <Tag color="orange">Mẫu nhỏ</Tag>
                      ) : (
                        <Tag color="green">Đủ mẫu</Tag>
                      )}
                    </Descriptions.Item>
                  </Descriptions>

                  <Table
                    rowKey="name"
                    size="small"
                    dataSource={profile.columns}
                    columns={[
                      { title: "Cột", dataIndex: "name" },
                      { title: "Kiểu", dataIndex: "data_type", width: 100 },
                      {
                        title: "Rỗng",
                        key: "null",
                        width: 130,
                        render: (_, row) =>
                          `${row.null_count} (${((row.null_ratio ?? 0) * 100).toFixed(1)}%)`,
                      },
                      { title: "Giá trị khác nhau", dataIndex: "distinct_count", width: 150 },
                      {
                        title: "Min / Max",
                        key: "range",
                        width: 180,
                        render: (_, row) =>
                          row.min !== undefined ? `${row.min} … ${row.max}` : "—",
                      },
                      {
                        title: "Mẫu",
                        dataIndex: "sample",
                        render: (sample: string[]) => (
                          <Text type="secondary" className="text-xs">
                            {sample.join(", ")}
                          </Text>
                        ),
                      },
                    ]}
                  />

                  {profile.suggested_rules?.length ? (
                    <Card size="small" title="Rule đề xuất từ dữ liệu quan sát được">
                      <Alert
                        type="info"
                        showIcon
                        className="mb-3"
                        message="Đề xuất chỉ là đề xuất."
                        description="Rule tạo từ đây vẫn ở trạng thái nháp và vẫn cần chủ sở hữu duyệt ngưỡng, nên profiling không thể tự siết cổng công bố."
                      />
                      <Table
                        rowKey="code"
                        size="small"
                        pagination={false}
                        dataSource={profile.suggested_rules}
                        columns={[
                          { title: "Mã", dataIndex: "code" },
                          { title: "Loại", dataIndex: "rule_type", width: 120 },
                          { title: "Cột", dataIndex: "field_name", width: 140 },
                          { title: "Vì sao", dataIndex: "rationale" },
                          {
                            title: "",
                            key: "add",
                            width: 100,
                            render: (_, row) =>
                              canManage ? (
                                <Button size="small" onClick={() => createRule(row)}>
                                  Thêm
                                </Button>
                              ) : null,
                          },
                        ]}
                      />
                    </Card>
                  ) : null}
                </Space>
              ) : (
                <Empty description="Bấm Profiling để đọc thống kê cột và nhận đề xuất rule" />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={ruleOpen}
        title="Khai báo quality rule"
        onCancel={() => setRuleOpen(false)}
        onOk={() => createRule()}
        okText="Tạo"
        cancelText="Huỷ"
        width={560}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ rule_type: "NOT_NULL", severity: "MAJOR", threshold: 0 }}
        >
          <Form.Item name="code" label="Mã rule" rules={[{ required: true }]}>
            <Input placeholder="ma_don_vi_not_null" />
          </Form.Item>
          <Form.Item name="name" label="Tên hiển thị">
            <Input />
          </Form.Item>
          <Form.Item name="rule_type" label="Loại rule" rules={[{ required: true }]}>
            <Select options={RULE_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
          </Form.Item>
          {RULE_TYPES.find((t) => t.value === ruleType)?.needsField !== false && (
            <Form.Item name="field_name" label="Cột" rules={[{ required: true }]}>
              {fields.length ? (
                <Select showSearch options={fields.map((f) => ({ value: f, label: f }))} />
              ) : (
                <Input placeholder="Tên cột trong schema đã công bố" />
              )}
            </Form.Item>
          )}
          <Form.Item
            name="severity"
            label="Mức nghiêm trọng"
            extra="Chỉ mức CRITICAL mới chặn công bố dataset Gold."
          >
            <Select
              options={[
                { value: "CRITICAL", label: "CRITICAL — chặn công bố" },
                { value: "MAJOR", label: "MAJOR — cảnh báo mạnh" },
                { value: "MINOR", label: "MINOR — ghi nhận" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="threshold"
            label="Ngưỡng vi phạm cho phép"
            extra="0 nghĩa là không chấp nhận dòng vi phạm nào. Tối đa 1."
          >
            <InputNumber min={0} max={1} step={0.01} className="w-full" />
          </Form.Item>
          <Form.Item
            name="config"
            label="Cấu hình"
            extra='Ví dụ RANGE: {"min": 0}. ENUM: {"values": ["A","B"]}. COMPARE: {"other_field": "ke_hoach", "operator": "lte"}.'
          >
            <Input.TextArea rows={3} placeholder="{}" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function readError(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { error?: { message?: string } } } })
    ?.response?.data?.error?.message;
  return detail || fallback;
}
