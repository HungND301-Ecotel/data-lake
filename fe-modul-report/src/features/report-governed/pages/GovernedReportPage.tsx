import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import governedReportApi, {
  type ReportDataQuery,
  type ReportDefinition,
  type ReportRun,
  type RunStatus,
} from "../api/governedReportApi";
import RunDetailDrawer from "../components/RunDetailDrawer";
import TemplateVersionModal from "../components/TemplateVersionModal";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const RUN_STATUS: Record<RunStatus, { color: string; label: string }> = {
  DRAFT: { color: "default", label: "Nháp" },
  PENDING_APPROVAL: { color: "processing", label: "Chờ duyệt" },
  APPROVED: { color: "green", label: "Đã duyệt" },
  REJECTED: { color: "red", label: "Từ chối" },
  EXPORTED: { color: "cyan", label: "Đã phát hành" },
};

function formatTime(value?: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "—";
}

export default function GovernedReportPage() {
  const [definitions, setDefinitions] = useState<ReportDefinition[]>([]);
  const [queries, setQueries] = useState<ReportDataQuery[]>([]);
  const [runs, setRuns] = useState<ReportRun[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [templateFor, setTemplateFor] = useState<ReportDefinition | null>(null);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [runForm] = Form.useForm();
  const [queryForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, q, r] = await Promise.all([
        governedReportApi.listDefinitions(),
        governedReportApi.listDataQueries(),
        governedReportApi.listRuns(),
      ]);
      setDefinitions(d.items);
      setQueries(q.items);
      setRuns(r.items);
    } catch {
      // axiosClient đã hiển thị lỗi
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createRun = async () => {
    const values = await runForm.validateFields();
    const [start, end] = values.period;
    const run = await governedReportApi.createRun({
      definitionCode: values.definitionCode,
      title: values.title,
      periodStart: start.format("YYYY-MM-DD"),
      periodEnd: end.format("YYYY-MM-DD"),
      skipNarrative: values.skipNarrative,
    });
    message.success("Đã chốt số liệu cho báo cáo");
    setRunModalOpen(false);
    runForm.resetFields();
    setSelectedRunId(run.id);
    load();
  };

  const createQuery = async () => {
    const values = await queryForm.validateFields();
    await governedReportApi.createDataQuery(values);
    message.success("Đã tạo truy vấn ở trạng thái nháp, cần người khác phê duyệt");
    setQueryModalOpen(false);
    queryForm.resetFields();
    load();
  };

  return (
    <div className="space-y-4">
      <Card
        title="Báo cáo có kiểm soát"
        extra={
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Làm mới
          </Button>
        }
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Số liệu được chốt một lần khi tạo báo cáo, AI chỉ viết nhận xét dựa trên các số liệu đã chốt."
          description="Bản xem trước, bản trình duyệt và bản phát hành đều đọc từ cùng một snapshot, nên ba bản không thể lệch nhau."
        />

        <Tabs
          items={[
            {
              key: "runs",
              label: `Lần sinh (${runs.length})`,
              children: (
                <>
                  <Space className="mb-3">
                    <Button type="primary" onClick={() => setRunModalOpen(true)}>
                      Sinh báo cáo
                    </Button>
                  </Space>
                  <Table
                    rowKey="id"
                    size="small"
                    loading={loading}
                    dataSource={runs}
                    onRow={(row) => ({ onClick: () => setSelectedRunId(row.id) })}
                    rowClassName="cursor-pointer"
                    columns={[
                      { title: "Tiêu đề", dataIndex: "title" },
                      { title: "Báo cáo", dataIndex: "definitionCode", width: 160 },
                      {
                        title: "Kỳ",
                        key: "period",
                        width: 190,
                        render: (_, row) => `${row.periodStart} → ${row.periodEnd}`,
                      },
                      {
                        title: "Trạng thái",
                        dataIndex: "status",
                        width: 140,
                        render: (value: RunStatus) => (
                          <Tag color={RUN_STATUS[value]?.color}>
                            {RUN_STATUS[value]?.label ?? value}
                          </Tag>
                        ),
                      },
                      {
                        title: "Mã kiểm chứng",
                        dataIndex: "snapshotChecksum",
                        width: 140,
                        render: (value: string) =>
                          value ? (
                            <Tooltip title={value}>
                              <Text code className="text-xs">
                                {value.slice(0, 10)}…
                              </Text>
                            </Tooltip>
                          ) : (
                            "—"
                          ),
                      },
                      {
                        title: "Tạo lúc",
                        dataIndex: "createdAt",
                        width: 170,
                        render: formatTime,
                      },
                    ]}
                  />
                </>
              ),
            },
            {
              key: "definitions",
              label: `Định nghĩa (${definitions.length})`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  loading={loading}
                  dataSource={definitions}
                  columns={[
                    { title: "Mã", dataIndex: "code", width: 170 },
                    { title: "Tên", dataIndex: "name" },
                    { title: "Đơn vị", dataIndex: "ownerOrgCode", width: 130 },
                    {
                      title: "Nhãn bảo mật",
                      key: "label",
                      width: 160,
                      render: (_, row) => (
                        <Tag color={(row.securityLevel ?? 0) >= 3 ? "red" : "blue"}>
                          {row.securityLabelCode ?? "—"}
                        </Tag>
                      ),
                    },
                    { title: "Định dạng", dataIndex: "templateFormat", width: 110 },
                    {
                      title: "Phiên bản mẫu",
                      key: "versions",
                      width: 190,
                      render: (_, row) =>
                        row.approvedVersionNo ? (
                          <Tag color="green">v{row.approvedVersionNo} đã duyệt</Tag>
                        ) : (
                          <Tag color="orange">{row.versionCount} bản, chưa duyệt</Tag>
                        ),
                    },
                    {
                      title: "",
                      key: "action",
                      width: 150,
                      render: (_, row) => (
                        <Button size="small" onClick={() => setTemplateFor(row)}>
                          Mẫu & ánh xạ
                        </Button>
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: "queries",
              label: `Truy vấn số liệu (${queries.length})`,
              children: (
                <>
                  <Alert
                    type="warning"
                    showIcon
                    className="mb-3"
                    message="Chỉ truy vấn đã được người khác phê duyệt mới dùng được cho báo cáo."
                    description="Câu lệnh chỉ được là SELECT, tham số hoá và có trần số dòng."
                  />
                  <Space className="mb-3">
                    <Button type="primary" onClick={() => setQueryModalOpen(true)}>
                      Tạo truy vấn
                    </Button>
                  </Space>
                  <Table
                    rowKey="id"
                    size="small"
                    loading={loading}
                    dataSource={queries}
                    columns={[
                      { title: "Mã", dataIndex: "code", width: 180 },
                      {
                        title: "Phiên bản",
                        dataIndex: "versionNo",
                        width: 100,
                        render: (value: number) => <Tag>v{value}</Tag>,
                      },
                      { title: "Tên", dataIndex: "name" },
                      { title: "Cột trả về", dataIndex: "outputColumns", width: 200 },
                      {
                        title: "Trạng thái",
                        dataIndex: "status",
                        width: 120,
                        render: (value: string) => (
                          <Tag color={value === "APPROVED" ? "green" : "orange"}>{value}</Tag>
                        ),
                      },
                      { title: "Người tạo", dataIndex: "createdBy", width: 150 },
                      {
                        title: "",
                        key: "action",
                        width: 120,
                        render: (_, row) =>
                          row.status === "APPROVED" ? null : (
                            <Popconfirm
                              title="Phê duyệt truy vấn này?"
                              onConfirm={async () => {
                                await governedReportApi.approveDataQuery(row.id);
                                message.success("Đã phê duyệt");
                                load();
                              }}
                            >
                              <Button size="small" type="primary">
                                Phê duyệt
                              </Button>
                            </Popconfirm>
                          ),
                      },
                    ]}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Sinh báo cáo"
        open={runModalOpen}
        onCancel={() => setRunModalOpen(false)}
        onOk={createRun}
      >
        <Alert
          type="info"
          showIcon
          className="mb-3"
          message="Số liệu sẽ được chốt ngay tại thời điểm này và không thay đổi về sau."
        />
        <Form form={runForm} layout="vertical" initialValues={{ skipNarrative: false }}>
          <Form.Item name="definitionCode" label="Báo cáo" rules={[{ required: true }]}>
            <Select
              options={definitions
                .filter((d) => d.approvedVersionNo)
                .map((d) => ({ value: d.code, label: `${d.name} (${d.code})` }))}
              placeholder="Chỉ hiện báo cáo đã có mẫu được duyệt"
            />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề">
            <Input placeholder="Để trống thì hệ thống tự đặt theo kỳ" />
          </Form.Item>
          <Form.Item name="period" label="Kỳ báo cáo" rules={[{ required: true }]}>
            <RangePicker className="w-full" />
          </Form.Item>
          <Form.Item name="skipNarrative" label="Phần nhận xét">
            <Select
              options={[
                { value: false, label: "Để AI soạn từ số liệu đã chốt" },
                { value: true, label: "Tự viết tay" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tạo truy vấn số liệu"
        open={queryModalOpen}
        onCancel={() => setQueryModalOpen(false)}
        onOk={createQuery}
        width={720}
      >
        <Form form={queryForm} layout="vertical">
          <Form.Item name="code" label="Mã truy vấn" rules={[{ required: true }]}>
            <Input placeholder="VD: Q_SAN_LUONG_THANG" />
          </Form.Item>
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="statement"
            label="Câu lệnh"
            rules={[{ required: true }]}
            extra="Chỉ SELECT. Dùng :period_start và :period_end cho kỳ báo cáo."
          >
            <Input.TextArea rows={5} placeholder="select ... from ... where ngay between :period_start and :period_end" />
          </Form.Item>
          <Form.Item name="outputColumns" label="Cột trả về">
            <Input placeholder="phan_xuong,san_luong" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="securityLabelCode" label="Nhãn bảo mật">
              <Select
                allowClear
                options={["PUBLIC", "INTERNAL", "RESTRICTED", "CONFIDENTIAL", "SECRET"].map(
                  (code) => ({ value: code, label: code })
                )}
              />
            </Form.Item>
            <Form.Item name="securityLevel" label="Mức độ mật" initialValue={0}>
              <Select options={[0, 1, 2, 3, 4].map((v) => ({ value: v, label: String(v) }))} />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <TemplateVersionModal
        definition={templateFor}
        queries={queries.filter((q) => q.status === "APPROVED")}
        onClose={() => setTemplateFor(null)}
        onChanged={load}
      />

      <RunDetailDrawer
        runId={selectedRunId}
        onClose={() => setSelectedRunId(null)}
        onChanged={load}
      />
    </div>
  );
}
