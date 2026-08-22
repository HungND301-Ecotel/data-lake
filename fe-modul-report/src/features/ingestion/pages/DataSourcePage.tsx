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
import sourceApi, {
  type ConnectorType,
  type DataSourceRow,
  type SourceStatus,
  type SyncRunRow,
} from "../api/sourceApi";
import { formatTime } from "../components/statusTags";
import { useHasPermission } from "../../../stores/authStore";

const { Text, Paragraph } = Typography;

const STATUS_COLOR: Record<SourceStatus, string> = {
  DRAFT: "default",
  TESTED: "blue",
  ACTIVE: "green",
  PAUSED: "orange",
  QUARANTINED: "red",
  RETIRED: "default",
};

const STATUS_HINT: Record<SourceStatus, string> = {
  DRAFT: "Chưa kiểm tra kết nối",
  TESTED: "Đã kết nối được, chưa kích hoạt",
  ACTIVE: "Đang chạy đồng bộ",
  PAUSED: "Tạm dừng — run mới bị chặn",
  QUARANTINED: "Cách ly vì schema drift phá vỡ",
  RETIRED: "Ngừng sử dụng",
};

const CONNECTORS: ConnectorType[] = [
  "PORTAL_UPLOAD",
  "FILE_SERVER",
  "POSTGRESQL",
  "MYSQL",
  "ORACLE",
  "SQLSERVER",
  "S3",
  "REST_API",
];

export default function DataSourcePage() {
  const canManage = useHasPermission("admin.manage");

  const [sources, setSources] = useState<DataSourceRow[]>([]);
  const [detail, setDetail] = useState<DataSourceRow | null>(null);
  const [runs, setRuns] = useState<SyncRunRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSources((await sourceApi.list()).items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (row: DataSourceRow) => {
    setDetail(await sourceApi.get(row.code));
    setRuns((await sourceApi.runs(row.code)).items);
  };

  const refreshDetail = async (code: string) => {
    setDetail(await sourceApi.get(code));
    setRuns((await sourceApi.runs(code)).items);
    await load();
  };

  const create = async () => {
    const values = await form.validateFields();
    try {
      await sourceApi.create(values);
      message.success("Đã tạo nguồn ở trạng thái nháp");
      setCreateOpen(false);
      form.resetFields();
      await load();
    } catch (error) {
      message.error(readError(error, "Không tạo được nguồn"));
    }
  };

  const setCredential = (row: DataSourceRow) => {
    let reference = "";
    let expires = "";
    Modal.confirm({
      title: `Khai báo credential cho ${row.code}`,
      width: 560,
      content: (
        <Space direction="vertical" className="w-full">
          <Alert
            type="warning"
            showIcon
            message="Chỉ nhập đường dẫn tới kho secret, không nhập mật khẩu."
            description="Máy chủ từ chối mọi payload có trường mật khẩu, và cũng từ chối chuỗi không phải tham chiếu."
          />
          <Input
            placeholder="vault://kv/data/lakehouse/erp#password"
            onChange={(e) => (reference = e.target.value)}
          />
          <Input
            placeholder="Hết hạn (ISO, tuỳ chọn)"
            onChange={(e) => (expires = e.target.value)}
          />
        </Space>
      ),
      okText: "Lưu tham chiếu",
      cancelText: "Huỷ",
      onOk: async () => {
        try {
          await sourceApi.setCredential(row.code, {
            reference,
            expires_at: expires || undefined,
          });
          message.success("Đã lưu tham chiếu");
          await refreshDetail(row.code);
        } catch (error) {
          message.error(readError(error, "Không lưu được"));
          throw error;
        }
      },
    });
  };

  const pause = (row: DataSourceRow) => {
    let reason = "";
    Modal.confirm({
      title: `Tạm dừng ${row.code}?`,
      content: (
        <Space direction="vertical" className="w-full">
          <Text type="secondary">
            Tạm dừng chặn mọi lần đồng bộ mới cho tới khi kích hoạt lại.
          </Text>
          <Input.TextArea
            rows={3}
            placeholder="Lý do (bắt buộc)"
            onChange={(e) => (reason = e.target.value)}
          />
        </Space>
      ),
      okText: "Tạm dừng",
      okButtonProps: { danger: true },
      cancelText: "Huỷ",
      onOk: async () => {
        await sourceApi.pause(row.code, reason);
        await refreshDetail(row.code);
      },
    });
  };

  const acknowledge = (row: DataSourceRow) => {
    let note = "";
    let resume = true;
    Modal.confirm({
      title: `Xác nhận schema drift của ${row.code}`,
      width: 560,
      content: (
        <Space direction="vertical" className="w-full">
          <Text type="secondary">
            Nguồn đang bị cách ly. Chỉ cho chạy lại khi mapping đã được sửa theo
            schema mới.
          </Text>
          <Input.TextArea
            rows={3}
            placeholder="Đã xử lý thế nào? (bắt buộc)"
            onChange={(e) => (note = e.target.value)}
          />
          <Space>
            <Switch defaultChecked onChange={(value) => (resume = value)} />
            <Text>Cho nguồn chạy lại</Text>
          </Space>
        </Space>
      ),
      okText: "Xác nhận",
      cancelText: "Huỷ",
      onOk: async () => {
        await sourceApi.acknowledgeDrift(row.code, note, resume);
        await refreshDetail(row.code);
      },
    });
  };

  return (
    <div className="space-y-4">
      <Card
        title="Nguồn dữ liệu"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Làm mới
            </Button>
            {canManage && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateOpen(true)}
              >
                Khai báo nguồn
              </Button>
            )}
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Credential luôn là tham chiếu tới kho secret, không bao giờ là giá trị."
          description="Cấu hình connector có phiên bản nên đọc lại được vì sao hôm qua đồng bộ khác hôm nay. Schema đổi kiểu hoặc mất cột sẽ đưa nguồn vào cách ly thay vì tiếp tục kéo dữ liệu theo hình dạng chưa ai xem."
        />

        <Table
          rowKey="id"
          size="small"
          loading={loading}
          dataSource={sources}
          onRow={(row) => ({ onClick: () => open(row) })}
          rowClassName="cursor-pointer"
          locale={{ emptyText: <Empty description="Chưa khai báo nguồn nào" /> }}
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
            { title: "Connector", dataIndex: "connector_type", width: 150 },
            {
              title: "Chế độ",
              dataIndex: "sync_mode",
              width: 130,
              render: (mode: string | null, row) =>
                mode ? (
                  <Space size={4}>
                    <Tag>{mode}</Tag>
                    <Text type="secondary" className="text-xs">
                      v{row.config_version}
                    </Text>
                  </Space>
                ) : (
                  <Text type="secondary">chưa cấu hình</Text>
                ),
            },
            {
              title: "Credential",
              dataIndex: "credential_reference",
              render: (reference: string | null, row) =>
                reference ? (
                  <Space direction="vertical" size={0}>
                    <Text code className="text-xs">
                      {reference}
                    </Text>
                    {row.warnings.map((warning) => (
                      <Text key={warning} type="warning" className="text-xs">
                        {warning}
                      </Text>
                    ))}
                  </Space>
                ) : (
                  <Text type="danger" className="text-xs">
                    chưa khai
                  </Text>
                ),
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 150,
              render: (status: SourceStatus, row) => (
                <Tooltip title={row.paused_reason ?? row.quarantined_reason ?? STATUS_HINT[status]}>
                  <Tag color={STATUS_COLOR[status]}>{status}</Tag>
                </Tooltip>
              ),
            },
            {
              title: "",
              key: "actions",
              width: 300,
              render: (_, row) =>
                canManage ? (
                  <Space onClick={(e) => e.stopPropagation()} wrap>
                    <Button size="small" onClick={() => setCredential(row)}>
                      Credential
                    </Button>
                    <Button
                      size="small"
                      onClick={async () => {
                        const result = await sourceApi.test(row.code);
                        if (result.ok) message.success(result.detail);
                        else message.warning(result.detail);
                        await load();
                      }}
                    >
                      Kiểm tra
                    </Button>
                    {row.status === "QUARANTINED" ? (
                      <Button size="small" danger onClick={() => acknowledge(row)}>
                        Xử lý drift
                      </Button>
                    ) : row.status === "ACTIVE" ? (
                      <Button size="small" onClick={() => pause(row)}>
                        Tạm dừng
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        type="primary"
                        onClick={async () => {
                          try {
                            await sourceApi.activate(row.code);
                            message.success("Đã kích hoạt");
                            await load();
                          } catch (error) {
                            message.error(readError(error, "Chưa đủ điều kiện"));
                          }
                        }}
                      >
                        Kích hoạt
                      </Button>
                    )}
                  </Space>
                ) : null,
            },
          ]}
        />
      </Card>

      <Modal
        open={createOpen}
        title="Khai báo nguồn dữ liệu"
        onCancel={() => setCreateOpen(false)}
        onOk={create}
        okText="Tạo"
        cancelText="Huỷ"
      >
        <Form form={form} layout="vertical" initialValues={{ connector_type: "POSTGRESQL" }}>
          <Form.Item name="code" label="Mã nguồn" rules={[{ required: true }]}>
            <Input placeholder="erp" />
          </Form.Item>
          <Form.Item name="name" label="Tên hiển thị">
            <Input placeholder="ERP sản xuất" />
          </Form.Item>
          <Form.Item
            name="connector_type"
            label="Connector"
            extra="Chỉ những connector trong danh sách được phép mới khai báo được."
            rules={[{ required: true }]}
          >
            <Select options={CONNECTORS.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="owner_user" label="Chủ sở hữu">
            <Input />
          </Form.Item>
          <Form.Item
            name="network_route_approved"
            label="Đường mạng đã được duyệt"
            valuePropName="checked"
            extra="Chưa duyệt đường mạng thì không kiểm tra kết nối được."
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        open={!!detail}
        width={900}
        title={detail ? `${detail.code} · ${detail.name}` : ""}
        onClose={() => setDetail(null)}
      >
        {detail && (
          <Space direction="vertical" className="w-full">
            {detail.status === "QUARANTINED" && (
              <Alert
                type="error"
                showIcon
                message="Nguồn đang bị cách ly vì schema drift phá vỡ."
                description={detail.quarantined_reason}
              />
            )}
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="Connector">
                {detail.connector_type}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={STATUS_COLOR[detail.status]}>{detail.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Đường mạng">
                {detail.network_route_approved ? "đã duyệt" : "chưa duyệt"}
              </Descriptions.Item>
              <Descriptions.Item label="Lần kiểm tra cuối">
                {formatTime(detail.last_tested_at)}
              </Descriptions.Item>
              <Descriptions.Item label="Kết quả kiểm tra" span={2}>
                {detail.last_test_result ?? "—"}
              </Descriptions.Item>
            </Descriptions>

            <Tabs
              items={[
                {
                  key: "configs",
                  label: `Cấu hình (${detail.configs?.length ?? 0})`,
                  children: (
                    <Table
                      rowKey="version"
                      size="small"
                      dataSource={detail.configs ?? []}
                      columns={[
                        { title: "Phiên bản", dataIndex: "version", width: 100 },
                        { title: "Chế độ", dataIndex: "sync_mode", width: 130 },
                        { title: "Endpoint", dataIndex: "endpoint" },
                        { title: "Watermark", dataIndex: "watermark_field", width: 140 },
                        { title: "Giá trị", dataIndex: "watermark_value", width: 190 },
                        {
                          title: "",
                          dataIndex: "active",
                          width: 110,
                          render: (active: boolean) =>
                            active ? <Tag color="green">đang dùng</Tag> : null,
                        },
                        { title: "Ghi chú", dataIndex: "change_note" },
                      ]}
                    />
                  ),
                },
                {
                  key: "schemas",
                  label: `Schema (${detail.schemas?.length ?? 0})`,
                  children: (
                    <Space direction="vertical" className="w-full">
                      {(detail.schemas ?? []).map((schema) => (
                        <Card
                          key={schema.object_name}
                          size="small"
                          title={`${schema.object_name} · v${schema.version}`}
                        >
                          <Table
                            rowKey="name"
                            size="small"
                            pagination={false}
                            dataSource={schema.columns}
                            columns={[
                              { title: "Cột", dataIndex: "name" },
                              { title: "Kiểu", dataIndex: "data_type", width: 140 },
                              {
                                title: "Cho phép rỗng",
                                dataIndex: "nullable",
                                width: 140,
                                render: (value: boolean) => (value ? "có" : "không"),
                              },
                              {
                                title: "Ánh xạ",
                                key: "mapping",
                                render: (_, row) =>
                                  schema.mapping[row.name] ?? (
                                    <Text type="secondary">—</Text>
                                  ),
                              },
                            ]}
                          />
                        </Card>
                      ))}
                    </Space>
                  ),
                },
                {
                  key: "drifts",
                  label: `Drift (${detail.drifts?.length ?? 0})`,
                  children: (
                    <Table
                      rowKey={(_, index) => String(index)}
                      size="small"
                      dataSource={detail.drifts ?? []}
                      locale={{ emptyText: <Empty description="Chưa phát hiện drift" /> }}
                      columns={[
                        { title: "Đối tượng", dataIndex: "object_name", width: 190 },
                        { title: "Loại", dataIndex: "kind", width: 200 },
                        { title: "Cột", dataIndex: "column_name", width: 150 },
                        { title: "Chi tiết", dataIndex: "detail" },
                        {
                          title: "",
                          dataIndex: "breaking",
                          width: 120,
                          render: (breaking: boolean) =>
                            breaking ? <Tag color="red">phá vỡ</Tag> : <Tag>thêm mới</Tag>,
                        },
                        {
                          title: "Đã xác nhận",
                          dataIndex: "acknowledged_by",
                          width: 140,
                          render: (value: string | null) => value ?? "—",
                        },
                      ]}
                    />
                  ),
                },
                {
                  key: "runs",
                  label: `Lịch sử đồng bộ (${runs.length})`,
                  children: (
                    <>
                      <Paragraph type="secondary">
                        Mỗi lần chạy ghi lại cửa sổ watermark nó tiêu thụ, nên chạy lại
                        đúng cửa sổ cũ bị chặn — trừ khi khai rõ là resnapshot và nêu lý
                        do.
                      </Paragraph>
                      <Table
                        rowKey="id"
                        size="small"
                        dataSource={runs}
                        columns={[
                          {
                            title: "Bắt đầu",
                            dataIndex: "started_at",
                            width: 175,
                            render: formatTime,
                          },
                          { title: "Chế độ", dataIndex: "sync_mode", width: 120 },
                          {
                            title: "Cửa sổ",
                            key: "window",
                            render: (_, row) =>
                              `${row.watermark_from ?? "—"} → ${row.watermark_to ?? "—"}`,
                          },
                          { title: "Số dòng", dataIndex: "rows_read", width: 100 },
                          {
                            title: "Kết quả",
                            dataIndex: "status",
                            width: 130,
                            render: (status: string, row) => (
                              <Tooltip title={row.error ?? undefined}>
                                <Tag
                                  color={
                                    status === "SUCCEEDED"
                                      ? "green"
                                      : status === "FAILED"
                                      ? "red"
                                      : "processing"
                                  }
                                >
                                  {status}
                                </Tag>
                              </Tooltip>
                            ),
                          },
                        ]}
                      />
                    </>
                  ),
                },
                {
                  key: "credentials",
                  label: `Credential (${detail.credentials?.length ?? 0})`,
                  children: (
                    <Table
                      rowKey="version"
                      size="small"
                      dataSource={detail.credentials ?? []}
                      columns={[
                        { title: "Phiên bản", dataIndex: "version", width: 100 },
                        {
                          title: "Tham chiếu",
                          dataIndex: "reference",
                          render: (value: string) => <Text code>{value}</Text>,
                        },
                        {
                          title: "Hết hạn",
                          dataIndex: "expires_at",
                          width: 175,
                          render: formatTime,
                        },
                        {
                          title: "Xoay lúc",
                          dataIndex: "rotated_at",
                          width: 175,
                          render: formatTime,
                        },
                        {
                          title: "",
                          dataIndex: "active",
                          width: 110,
                          render: (active: boolean) =>
                            active ? <Tag color="green">đang dùng</Tag> : null,
                        },
                      ]}
                    />
                  ),
                },
              ]}
            />
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
