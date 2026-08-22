import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import biApi, {
  type BiDataSource,
  type BiExportRow,
  type BiRefreshRun,
  type BiView,
  type PersonaPreview,
} from "../api/biApi";
import catalogApi, { type Dataset } from "../api/catalogApi";
import { formatTime } from "../components/statusTags";
import { useHasPermission } from "../../../stores/authStore";

const { Text, Paragraph } = Typography;

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "default",
  ACTIVE: "green",
  SUSPENDED: "orange",
  REVOKED: "red",
};

const REFRESH_COLOR: Record<string, string> = {
  RUNNING: "processing",
  SUCCEEDED: "green",
  FAILED: "red",
};

export default function BiIntegrationPage() {
  const canManage = useHasPermission("bi.manage");

  const [views, setViews] = useState<BiView[]>([]);
  const [sources, setSources] = useState<BiDataSource[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);

  const [viewOpen, setViewOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [selectedView, setSelectedView] = useState<BiView | null>(null);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);

  const [viewForm] = Form.useForm();
  const [sourceForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [v, s, d] = await Promise.all([
        biApi.listViews(),
        biApi.listDataSources(),
        // Chỉ dataset gold_bi mới dựng view BI được (tài liệu 4.3, M12).
        catalogApi.listDatasets({ namespace: "gold_bi", size: 100 }),
      ]);
      setViews(v.items);
      setSources(s.items);
      setDatasets(d.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openView = async (code: string) => {
    setSelectedView(await biApi.getView(code));
  };

  const createView = async () => {
    const values = await viewForm.validateFields();
    try {
      const created = await biApi.createView(values);
      message.success(`Đã tạo view ${created.code} ở trạng thái nháp`);
      setViewOpen(false);
      viewForm.resetFields();
      await load();
      setSelectedView(created);
    } catch (error) {
      message.error(readError(error, "Không tạo được view"));
    }
  };

  const createSource = async () => {
    const values = await sourceForm.validateFields();
    try {
      await biApi.createDataSource(values);
      message.success("Đã đăng ký data source");
      setSourceOpen(false);
      sourceForm.resetFields();
      await load();
    } catch (error) {
      message.error(readError(error, "Không đăng ký được data source"));
    }
  };

  const refresh = async (code: string) => {
    try {
      const run = await biApi.refresh(code);
      if (run.status === "SUCCEEDED") {
        message.success(`Đã làm mới ${run.rows} dòng`);
      } else {
        message.warning(
          run.kept_previous
            ? `Làm mới lỗi, vẫn giữ nguyên extract trước (${run.rows} dòng)`
            : "Làm mới lỗi và chưa có extract nào trước đó"
        );
      }
      await load();
    } catch (error) {
      message.error(readError(error, "Không làm mới được"));
    }
  };

  const revoke = (source: BiDataSource) => {
    let reason = "";
    Modal.confirm({
      title: `Ngắt truy cập BI của ${source.code}?`,
      content: (
        <Space direction="vertical" className="w-full">
          <Text type="secondary">
            Workbook đang dùng data source này sẽ mất kết nối ngay. Thao tác được ghi
            nhật ký kiểm toán.
          </Text>
          <Input.TextArea
            rows={3}
            placeholder="Lý do ngắt (bắt buộc)"
            onChange={(e) => {
              reason = e.target.value;
            }}
          />
        </Space>
      ),
      okText: "Ngắt truy cập",
      okButtonProps: { danger: true },
      cancelText: "Huỷ",
      onOk: async () => {
        if (!reason.trim()) {
          message.error("Phải nhập lý do");
          throw new Error("missing reason");
        }
        await biApi.revoke(source.code, reason);
        message.success("Đã ngắt truy cập");
        await load();
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card
        title="Tích hợp BI / Tableau"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Làm mới
            </Button>
            {canManage && (
              <>
                <Button onClick={() => setSourceOpen(true)}>Đăng ký data source</Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setViewOpen(true)}
                >
                  Tạo view
                </Button>
              </>
            )}
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Tableau chỉ đọc view trên dataset gold_bi, không chạm được Bronze/Silver."
          description="Một view chỉ kích hoạt được khi đã có ánh xạ row-level security, và cấu hình data source không nhận mật khẩu — chỉ nhận tham chiếu tới secret trong Vault."
        />

        <Tabs
          items={[
            {
              key: "views",
              label: `View (${views.length})`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  loading={loading}
                  dataSource={views}
                  locale={{ emptyText: <Empty description="Chưa có view BI nào" /> }}
                  onRow={(row) => ({ onClick: () => openView(row.code) })}
                  rowClassName="cursor-pointer"
                  columns={[
                    {
                      title: "Mã view",
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
                    { title: "Dataset", dataIndex: "dataset_code" },
                    {
                      title: "RLS",
                      dataIndex: "rls_enabled",
                      width: 110,
                      render: (enabled: boolean) =>
                        enabled ? (
                          <Tag color="green">Bật</Tag>
                        ) : (
                          <Tooltip title="View tắt RLS sẽ không kích hoạt được">
                            <Tag color="red">Tắt</Tag>
                          </Tooltip>
                        ),
                    },
                    {
                      title: "Trạng thái",
                      dataIndex: "status",
                      width: 130,
                      render: (status: string) => (
                        <Tag color={STATUS_COLOR[status] ?? "default"}>{status}</Tag>
                      ),
                    },
                    {
                      title: "Kích hoạt lúc",
                      dataIndex: "applied_at",
                      width: 180,
                      render: formatTime,
                    },
                  ]}
                />
              ),
            },
            {
              key: "sources",
              label: `Data source (${sources.length})`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  loading={loading}
                  dataSource={sources}
                  locale={{ emptyText: <Empty description="Chưa có data source nào" /> }}
                  columns={[
                    {
                      title: "Mã",
                      dataIndex: "code",
                      render: (value: string, row) => (
                        <Space direction="vertical" size={0}>
                          <Text strong>{value}</Text>
                          <Text type="secondary" className="text-xs">
                            view {row.view_code}
                          </Text>
                        </Space>
                      ),
                    },
                    {
                      title: "Chế độ",
                      dataIndex: "connection_mode",
                      width: 110,
                      render: (mode: string) => <Tag>{mode}</Tag>,
                    },
                    {
                      title: "Lần làm mới cuối",
                      dataIndex: "last_refresh",
                      width: 260,
                      render: (run: BiRefreshRun | null) =>
                        run ? (
                          <Space direction="vertical" size={0}>
                            <Space size={4}>
                              <Tag color={REFRESH_COLOR[run.status] ?? "default"}>
                                {run.status}
                              </Tag>
                              <Text className="text-xs">{run.rows} dòng</Text>
                              {run.kept_previous && (
                                <Tooltip title="Lần chạy lỗi nhưng extract trước vẫn còn nguyên">
                                  <Tag color="blue">giữ bản trước</Tag>
                                </Tooltip>
                              )}
                            </Space>
                            <Text type="secondary" className="text-xs">
                              {formatTime(run.started_at)}
                            </Text>
                          </Space>
                        ) : (
                          <Text type="secondary">Chưa chạy</Text>
                        ),
                    },
                    {
                      title: "Export",
                      dataIndex: "export_requires_approval",
                      width: 150,
                      render: (required: boolean) =>
                        required ? (
                          <Tag color="gold">Cần phê duyệt</Tag>
                        ) : (
                          <Tag>Tự do</Tag>
                        ),
                    },
                    {
                      title: "Trạng thái",
                      dataIndex: "status",
                      width: 120,
                      render: (status: string, row) => (
                        <Tooltip title={row.revoke_reason ?? undefined}>
                          <Tag color={STATUS_COLOR[status] ?? "default"}>{status}</Tag>
                        </Tooltip>
                      ),
                    },
                    {
                      title: "",
                      key: "actions",
                      width: 220,
                      render: (_, row) => (
                        <Space>
                          <Button size="small" onClick={() => setSelectedSource(row.code)}>
                            Nhật ký
                          </Button>
                          {canManage && row.status === "ACTIVE" && (
                            <>
                              {row.connection_mode === "EXTRACT" && (
                                <Button size="small" onClick={() => refresh(row.code)}>
                                  Làm mới
                                </Button>
                              )}
                              <Button size="small" danger onClick={() => revoke(row)}>
                                Ngắt
                              </Button>
                            </>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={viewOpen}
        title="Tạo view BI"
        onCancel={() => setViewOpen(false)}
        onOk={createView}
        okText="Tạo"
        cancelText="Huỷ"
      >
        <Form form={viewForm} layout="vertical" initialValues={{ rls_enabled: true }}>
          <Form.Item name="code" label="Mã view" rules={[{ required: true }]}>
            <Input placeholder="v_san_luong_thang" />
          </Form.Item>
          <Form.Item name="name" label="Tên hiển thị">
            <Input placeholder="Sản lượng theo tháng" />
          </Form.Item>
          <Form.Item
            name="dataset_code"
            label="Dataset nguồn (gold_bi)"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              options={datasets.map((d) => ({
                value: d.code,
                label: `${d.code} · ${d.status}`,
                disabled: d.status !== "PUBLISHED",
              }))}
              notFoundContent={<Empty description="Chưa có dataset gold_bi nào" />}
            />
          </Form.Item>
          <Form.Item
            name="rls_enabled"
            label="Row-level security"
            valuePropName="checked"
            extra="Tắt RLS thì view sẽ không kích hoạt được; giữ bật là mặc định đúng."
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={sourceOpen}
        title="Đăng ký data source cho Tableau"
        onCancel={() => setSourceOpen(false)}
        onOk={createSource}
        okText="Đăng ký"
        cancelText="Huỷ"
      >
        <Alert
          type="warning"
          showIcon
          className="mb-3"
          message="Không nhập mật khẩu ở đây."
          description="Chỉ khai báo đường dẫn tới secret, ví dụ vault://bi/readonly. Máy chủ sẽ từ chối payload có trường mật khẩu."
        />
        <Form
          form={sourceForm}
          layout="vertical"
          initialValues={{ connection_mode: "EXTRACT", max_extract_rows: 1000000 }}
        >
          <Form.Item name="code" label="Mã data source" rules={[{ required: true }]}>
            <Input placeholder="ds_san_luong" />
          </Form.Item>
          <Form.Item name="name" label="Tên hiển thị">
            <Input />
          </Form.Item>
          <Form.Item name="view_code" label="View" rules={[{ required: true }]}>
            <Select
              showSearch
              options={views.map((v) => ({
                value: v.code,
                label: `${v.code} · ${v.status}`,
                disabled: v.status !== "ACTIVE",
              }))}
            />
          </Form.Item>
          <Form.Item name="connection_mode" label="Chế độ kết nối">
            <Select
              options={[
                { value: "EXTRACT", label: "EXTRACT — bản trích, làm mới định kỳ" },
                { value: "LIVE", label: "LIVE — đọc trực tiếp view" },
              ]}
            />
          </Form.Item>
          <Form.Item name="service_account_ref" label="Tham chiếu service account">
            <Input placeholder="vault://bi/readonly" />
          </Form.Item>
          <Form.Item name="workbook_ref" label="Workbook">
            <Input placeholder="tableau://workbooks/san-luong" />
          </Form.Item>
          <Form.Item
            name="max_extract_rows"
            label="Trần số dòng cho extract"
            extra="Vượt trần thì lần làm mới bị chặn, không âm thầm cắt bớt dữ liệu."
          >
            <InputNumber min={1} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>

      <ViewDrawer
        view={selectedView}
        canManage={canManage}
        onClose={() => setSelectedView(null)}
        onChanged={async (code) => {
          await load();
          setSelectedView(await biApi.getView(code));
        }}
      />

      <SourceDrawer code={selectedSource} onClose={() => setSelectedSource(null)} />
    </div>
  );
}

/** Chi tiết view: DDL sinh ra, ánh xạ RLS và kiểm thử persona (UC12.03). */
function ViewDrawer({
  view,
  canManage,
  onClose,
  onChanged,
}: {
  view: BiView | null;
  canManage: boolean;
  onClose: () => void;
  onChanged: (code: string) => Promise<void>;
}) {
  const [mappingForm] = Form.useForm();
  const [personaRef, setPersonaRef] = useState("");
  const [preview, setPreview] = useState<PersonaPreview | null>(null);

  useEffect(() => {
    setPreview(null);
    setPersonaRef("");
  }, [view?.id]);

  if (!view) return null;

  const addMapping = async () => {
    const values = await mappingForm.validateFields();
    let rowFilter: Record<string, unknown> | undefined;
    if (values.row_filter) {
      try {
        rowFilter = JSON.parse(values.row_filter);
      } catch {
        message.error("Bộ lọc dòng phải là JSON hợp lệ");
        return;
      }
    }
    try {
      await biApi.addMapping(view.code, { ...values, row_filter: rowFilter });
      message.success("Đã ánh xạ");
      mappingForm.resetFields();
      await onChanged(view.code);
    } catch (error) {
      message.error(readError(error, "Không ánh xạ được"));
    }
  };

  const apply = async () => {
    try {
      const applied = await biApi.applyView(view.code);
      if (applied.apply_error) {
        message.warning(applied.apply_error);
      } else {
        message.success("Đã kích hoạt view");
      }
      await onChanged(view.code);
    } catch (error) {
      message.error(readError(error, "Không kích hoạt được view"));
    }
  };

  const runPreview = async () => {
    if (!personaRef.trim()) return;
    setPreview(await biApi.preview(view.code, personaRef.trim()));
  };

  return (
    <Drawer open width={860} title={`View ${view.code}`} onClose={onClose}>
      <Descriptions size="small" column={2} bordered className="mb-4">
        <Descriptions.Item label="Dataset">{view.dataset_code}</Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <Tag color={STATUS_COLOR[view.status] ?? "default"}>{view.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="RLS">
          {view.rls_enabled ? "Bật" : "Tắt"}
        </Descriptions.Item>
        <Descriptions.Item label="Kích hoạt lúc">
          {formatTime(view.applied_at)}
        </Descriptions.Item>
      </Descriptions>

      {view.apply_error && (
        <Alert type="warning" showIcon className="mb-4" message={view.apply_error} />
      )}

      <Tabs
        items={[
          {
            key: "rls",
            label: `Ánh xạ RLS (${view.rls_mappings?.length ?? 0})`,
            children: (
              <Space direction="vertical" className="w-full">
                <Table
                  rowKey="id"
                  size="small"
                  pagination={false}
                  dataSource={view.rls_mappings ?? []}
                  locale={{
                    emptyText: (
                      <Empty description="Chưa ánh xạ ai; view sẽ không kích hoạt được" />
                    ),
                  }}
                  columns={[
                    { title: "Loại", dataIndex: "principal_type", width: 90 },
                    { title: "Định danh", dataIndex: "principal_ref" },
                    { title: "Đơn vị", dataIndex: "org_id", ellipsis: true },
                    { title: "Mức mật tối đa", dataIndex: "max_clearance", width: 130 },
                    {
                      title: "Bộ lọc dòng",
                      dataIndex: "row_filter",
                      render: (filter: Record<string, unknown> | null) =>
                        filter ? (
                          <Text code className="text-xs">
                            {JSON.stringify(filter)}
                          </Text>
                        ) : (
                          <Text type="secondary">—</Text>
                        ),
                    },
                  ]}
                />

                {canManage && (
                  <Card size="small" title="Thêm ánh xạ">
                    <Form
                      form={mappingForm}
                      layout="inline"
                      initialValues={{ principal_type: "GROUP", max_clearance: 1 }}
                    >
                      <Form.Item name="principal_type">
                        <Select
                          style={{ width: 110 }}
                          options={[
                            { value: "GROUP", label: "Nhóm" },
                            { value: "USER", label: "Người dùng" },
                          ]}
                        />
                      </Form.Item>
                      <Form.Item name="principal_ref" rules={[{ required: true }]}>
                        <Input placeholder="phong-ke-hoach" style={{ width: 180 }} />
                      </Form.Item>
                      <Form.Item name="max_clearance">
                        <InputNumber min={0} max={4} placeholder="Mức mật" />
                      </Form.Item>
                      <Form.Item name="row_filter">
                        <Input placeholder='{"ma_don_vi":"PX1"}' style={{ width: 220 }} />
                      </Form.Item>
                      <Form.Item>
                        <Button onClick={addMapping}>Thêm</Button>
                      </Form.Item>
                    </Form>
                  </Card>
                )}

                {canManage && view.status !== "ACTIVE" && (
                  <Button type="primary" onClick={apply}>
                    Kích hoạt view
                  </Button>
                )}
              </Space>
            ),
          },
          {
            key: "persona",
            label: "Kiểm thử persona",
            children: (
              <Space direction="vertical" className="w-full">
                <Paragraph type="secondary">
                  Xem đúng phần dữ liệu một persona sẽ thấy, trước khi nối Tableau. Người
                  chưa được ánh xạ thì không thấy dòng nào, không phải thấy tất cả.
                </Paragraph>
                <Space.Compact className="w-full">
                  <Input
                    value={personaRef}
                    onChange={(e) => setPersonaRef(e.target.value)}
                    onPressEnter={runPreview}
                    placeholder="Định danh người dùng hoặc nhóm"
                  />
                  <Button type="primary" onClick={runPreview}>
                    Xem thử
                  </Button>
                </Space.Compact>

                {preview && !preview.mapped && (
                  <Alert
                    type="warning"
                    showIcon
                    message={`${preview.principal_ref} chưa được ánh xạ nên không thấy dòng nào.`}
                  />
                )}
                {preview?.mapped && (
                  <>
                    <Alert
                      type="success"
                      showIcon
                      message={`Thấy ${preview.total} dòng · mức mật tối đa ${preview.max_clearance} · đơn vị ${preview.org_id ?? "mọi đơn vị"}`}
                    />
                    <Table
                      size="small"
                      rowKey={(_, index) => String(index)}
                      dataSource={preview.items}
                      pagination={{ pageSize: 10 }}
                      columns={Object.keys(preview.items[0] ?? {}).map((key) => ({
                        title: key,
                        dataIndex: key,
                        render: (value: unknown) => String(value ?? "—"),
                      }))}
                    />
                  </>
                )}
              </Space>
            ),
          },
          {
            key: "ddl",
            label: "DDL",
            children: (
              <Paragraph>
                <pre className="text-xs overflow-auto">{view.sql_definition}</pre>
              </Paragraph>
            ),
          },
        ]}
      />
    </Drawer>
  );
}

/** Nhật ký làm mới và nhật ký xuất dữ liệu của một data source. */
function SourceDrawer({ code, onClose }: { code: string | null; onClose: () => void }) {
  const [runs, setRuns] = useState<BiRefreshRun[]>([]);
  const [exports, setExports] = useState<BiExportRow[]>([]);

  useEffect(() => {
    if (!code) return;
    let alive = true;
    (async () => {
      const [r, e] = await Promise.all([
        biApi.refreshHistory(code),
        biApi.exportHistory(code).catch(() => ({ total: 0, items: [] })),
      ]);
      if (!alive) return;
      setRuns(r.items);
      setExports(e.items);
    })();
    return () => {
      alive = false;
    };
  }, [code]);

  if (!code) return null;

  return (
    <Drawer open width={820} title={`Nhật ký ${code}`} onClose={onClose}>
      <Tabs
        items={[
          {
            key: "refresh",
            label: `Làm mới (${runs.length})`,
            children: (
              <Table
                size="small"
                rowKey={(_, index) => String(index)}
                dataSource={runs}
                columns={[
                  {
                    title: "Bắt đầu",
                    dataIndex: "started_at",
                    width: 180,
                    render: formatTime,
                  },
                  {
                    title: "Kết quả",
                    dataIndex: "status",
                    width: 130,
                    render: (status: string) => (
                      <Tag color={REFRESH_COLOR[status] ?? "default"}>{status}</Tag>
                    ),
                  },
                  { title: "Số dòng", dataIndex: "rows", width: 100 },
                  {
                    title: "Giữ bản trước",
                    dataIndex: "kept_previous",
                    width: 130,
                    render: (kept: boolean) => (kept ? <Tag color="blue">Có</Tag> : "—"),
                  },
                  { title: "Lỗi", dataIndex: "error", ellipsis: true },
                  { title: "Người kích hoạt", dataIndex: "triggered_by", width: 150 },
                ]}
              />
            ),
          },
          {
            key: "export",
            label: `Xuất dữ liệu (${exports.length})`,
            children: (
              <Table
                size="small"
                rowKey={(_, index) => String(index)}
                dataSource={exports}
                locale={{
                  emptyText: <Empty description="Chưa có lần xuất nào, hoặc bạn không có quyền đọc nhật ký" />,
                }}
                columns={[
                  {
                    title: "Thời điểm",
                    dataIndex: "occurred_at",
                    width: 180,
                    render: formatTime,
                  },
                  { title: "Người xuất", dataIndex: "principal_ref" },
                  { title: "Định dạng", dataIndex: "export_format", width: 100 },
                  { title: "Số dòng", dataIndex: "rows", width: 90 },
                  {
                    title: "Kết quả",
                    dataIndex: "result",
                    width: 110,
                    render: (result: string, row) => (
                      <Tooltip title={row.denial_reason ?? undefined}>
                        <Tag color={result === "SUCCESS" ? "green" : "red"}>{result}</Tag>
                      </Tooltip>
                    ),
                  },
                  { title: "Người duyệt", dataIndex: "approved_by", width: 140 },
                ]}
              />
            ),
          },
        ]}
      />
    </Drawer>
  );
}

function readError(error: unknown, fallback: string): string {
  const detail = (error as { response?: { data?: { error?: { message?: string } } } })
    ?.response?.data?.error?.message;
  return detail || fallback;
}
