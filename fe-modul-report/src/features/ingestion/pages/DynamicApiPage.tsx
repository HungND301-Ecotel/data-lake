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
import dynamicApi, {
  type ApiProduct,
  type ApiUsageRow,
  type ApiVersion,
  type MaskStrategy,
} from "../api/dynamicApi";
import catalogApi, { type Dataset } from "../api/catalogApi";
import { formatTime } from "../components/statusTags";

const { Text, Paragraph } = Typography;

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "default",
  REVIEW: "processing",
  PUBLISHED: "green",
  DEPRECATED: "orange",
  REVOKED: "red",
};

const MASK_OPTIONS: { value: MaskStrategy; label: string }[] = [
  { value: "NONE", label: "Nguyên bản" },
  { value: "PARTIAL", label: "Che một phần" },
  { value: "HASH", label: "Băm" },
  { value: "HIDDEN", label: "Ẩn giá trị" },
];

export default function DynamicApiPage() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [newSecret, setNewSecret] = useState<{ clientId: string; secret: string } | null>(
    null
  );
  const [form] = Form.useForm();
  const [clientForm] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, d] = await Promise.all([
        dynamicApi.listProducts(),
        // Chỉ dataset gold_api mới dùng làm nguồn cho API được.
        catalogApi.listDatasets({ namespace: "gold_api", size: 100 }),
      ]);
      setProducts(p.items);
      setDatasets(d.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <Card
        title="Dynamic API"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Làm mới
            </Button>
            <Button onClick={() => setClientOpen(true)}>Tạo client</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Tạo API
            </Button>
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="API được dựng từ metadata của danh mục dữ liệu, không phải từ SQL tự do."
          description="Chỉ dataset thuộc namespace gold_api mới làm nguồn được. Trường gắn nhãn PII hoặc MẬT bắt buộc phải che hoặc loại khỏi API, và mỗi phiên bản phải qua security review trước khi publish."
        />

        <Table
          rowKey="id"
          size="small"
          loading={loading}
          dataSource={products}
          onRow={(row) => ({ onClick: () => setSelected(row.code) })}
          rowClassName="cursor-pointer"
          columns={[
            {
              title: "Mã",
              dataIndex: "code",
              width: 200,
              render: (value: string, row) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{value}</Text>
                  <Text type="secondary" className="text-xs">
                    {row.name}
                  </Text>
                </Space>
              ),
            },
            { title: "Dataset nguồn", dataIndex: "dataset_code", width: 200 },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 130,
              render: (value: string) => <Tag color={STATUS_COLOR[value]}>{value}</Tag>,
            },
            {
              title: "Phiên bản",
              dataIndex: "current_version",
              width: 110,
              render: (value: string | null) => value ?? "—",
            },
            {
              title: "Trang tối đa",
              dataIndex: "max_page_size",
              width: 120,
            },
            {
              title: "Mức mật",
              dataIndex: "security_level",
              width: 100,
              render: (value: number) => (
                <Tag color={value >= 3 ? "red" : "blue"}>{value}</Tag>
              ),
            },
            { title: "Chủ sở hữu", dataIndex: "owner_user", width: 150 },
          ]}
        />
      </Card>

      <Modal
        title="Tạo API product"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={async () => {
          const values = await form.validateFields();
          await dynamicApi.createProduct(values);
          message.success("Đã tạo ở trạng thái nháp");
          setCreateOpen(false);
          form.resetFields();
          load();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Mã API" rules={[{ required: true }]}>
            <Input placeholder="api_san_luong" />
          </Form.Item>
          <Form.Item name="name" label="Tên">
            <Input />
          </Form.Item>
          <Form.Item
            name="dataset_code"
            label="Dataset nguồn"
            rules={[{ required: true }]}
            extra="Chỉ hiện dataset thuộc namespace gold_api"
          >
            <Select
              options={datasets.map((d) => ({
                value: d.code,
                label: `${d.code} (${d.status})`,
              }))}
            />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="default_page_size" label="Số dòng mặc định" initialValue={50}>
              <InputNumber min={1} className="w-full" />
            </Form.Item>
            <Form.Item name="max_page_size" label="Số dòng tối đa" initialValue={500}>
              <InputNumber min={1} max={1000} className="w-full" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Tạo client máy-máy"
        open={clientOpen}
        onCancel={() => setClientOpen(false)}
        onOk={async () => {
          const values = await clientForm.validateFields();
          const created = await dynamicApi.createClient(values);
          setNewSecret({ clientId: created.client_id, secret: created.client_secret });
          setClientOpen(false);
          clientForm.resetFields();
        }}
      >
        <Form form={clientForm} layout="vertical">
          <Form.Item name="client_id" label="Client ID" rules={[{ required: true }]}>
            <Input placeholder="bi-tableau" />
          </Form.Item>
          <Form.Item name="name" label="Tên">
            <Input />
          </Form.Item>
          <Form.Item name="contact" label="Liên hệ">
            <Input placeholder="email hoặc số điện thoại" />
          </Form.Item>
          <Form.Item
            name="clearance_level"
            label="Mức độ mật tối đa"
            initialValue={0}
            extra="Client không nhận được dòng dữ liệu vượt mức này"
          >
            <Select options={[0, 1, 2, 3, 4].map((v) => ({ value: v, label: String(v) }))} />
          </Form.Item>
          <Form.Item name="require_mtls" label="Bắt buộc mTLS" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Client secret"
        open={Boolean(newSecret)}
        onCancel={() => setNewSecret(null)}
        footer={[
          <Button key="ok" type="primary" onClick={() => setNewSecret(null)}>
            Tôi đã lưu lại
          </Button>,
        ]}
      >
        <Alert
          type="warning"
          showIcon
          className="mb-3"
          message="Secret chỉ hiển thị một lần"
          description="Hệ thống chỉ lưu bản băm. Làm mất thì phải tạo client mới."
        />
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Client ID">{newSecret?.clientId}</Descriptions.Item>
          <Descriptions.Item label="Client secret">
            <Paragraph copyable className="m-0 break-all">
              {newSecret?.secret}
            </Paragraph>
          </Descriptions.Item>
        </Descriptions>
      </Modal>

      <ProductDrawer
        code={selected}
        onClose={() => setSelected(null)}
        onChanged={load}
      />
    </div>
  );
}

function ProductDrawer({
  code,
  onClose,
  onChanged,
}: {
  code: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [usage, setUsage] = useState<ApiUsageRow[]>([]);
  const [spec, setSpec] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    try {
      const detail = await dynamicApi.getProduct(code);
      setProduct(detail);
      const latest = detail.versions?.[0];
      if (latest) {
        const document = await dynamicApi.openapi(code, latest.version);
        setSpec(JSON.stringify(document, null, 2));
      }
      try {
        setUsage((await dynamicApi.usage(code)).items);
      } catch {
        setUsage([]); // cần quyền audit.read
      }
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    setProduct(null);
    setSpec("");
    setUsage([]);
    load();
  }, [load]);

  const act = async (action: () => Promise<unknown>, success: string) => {
    await action();
    message.success(success);
    await load();
    onChanged();
  };

  const latest: ApiVersion | undefined = product?.versions?.[0];

  return (
    <Drawer
      title={product ? `${product.code} · ${product.name}` : "Chi tiết API"}
      width={980}
      open={Boolean(code)}
      onClose={onClose}
      extra={
        product &&
        latest && (
          <Space>
            <Button
              onClick={() =>
                act(() => dynamicApi.materialize(product.code), "Đã dựng dữ liệu Gold")
              }
            >
              Vật chất hoá dữ liệu
            </Button>
            {latest.status === "DRAFT" && (
              <Button
                onClick={() =>
                  act(
                    () => dynamicApi.submit(product.code, latest.version),
                    "Đã trình security review"
                  )
                }
              >
                Trình review
              </Button>
            )}
            {latest.status === "REVIEW" && !latest.reviewed_by && (
              <Button
                type="primary"
                onClick={() =>
                  act(
                    () =>
                      dynamicApi.review(
                        product.code,
                        latest.version,
                        true,
                        window.prompt("Ghi chú review") || undefined
                      ),
                    "Đã duyệt"
                  )
                }
              >
                Duyệt
              </Button>
            )}
            {latest.status === "REVIEW" && latest.reviewed_by && (
              <Button
                type="primary"
                onClick={() =>
                  act(
                    () => dynamicApi.publish(product.code, latest.version),
                    "Đã publish"
                  )
                }
              >
                Publish
              </Button>
            )}
            {product.status === "PUBLISHED" && (
              <Button
                danger
                onClick={() => {
                  const reason = window.prompt("Lý do thu hồi (bắt buộc)") || "";
                  if (!reason.trim()) {
                    message.warning("Thu hồi phải kèm lý do");
                    return;
                  }
                  act(() => dynamicApi.revoke(product.code, reason), "Đã thu hồi API");
                }}
              >
                Thu hồi
              </Button>
            )}
          </Space>
        )
      }
    >
      {!product ? (
        <Empty description={loading ? "Đang tải" : "Không có dữ liệu"} />
      ) : (
        <>
          {product.status === "REVOKED" && (
            <Alert
              type="error"
              showIcon
              className="mb-4"
              message="API đã bị thu hồi"
              description={`${latest?.revoke_reason ?? ""} — mọi lời gọi trả về 410.`}
            />
          )}
          {latest?.status === "REVIEW" && !latest.reviewed_by && (
            <Alert
              type="warning"
              showIcon
              className="mb-4"
              message="Đang chờ security review"
              description="Người thiết kế API không được tự duyệt bản của mình."
            />
          )}

          <Tabs
            items={[
              {
                key: "info",
                label: "Thông tin",
                children: (
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="Dataset nguồn">
                      {product.dataset_code} ({product.dataset_status})
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      <Tag color={STATUS_COLOR[product.status]}>{product.status}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Phiên bản hiện hành">
                      {product.current_version ?? "chưa publish"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Chủ sở hữu">
                      {product.owner_user}
                    </Descriptions.Item>
                    <Descriptions.Item label="Số dòng mặc định / tối đa">
                      {product.default_page_size} / {product.max_page_size}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mức độ mật">
                      <Tag color={product.security_level >= 3 ? "red" : "blue"}>
                        {product.security_level}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Đường dẫn dữ liệu" span={2}>
                      <Text code>
                        GET /api/v1/data/{product.code}/{product.current_version ?? "v1"}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: "fields",
                label: `Trường lộ ra (${latest?.fields.length ?? 0})`,
                children: (
                  <Table
                    rowKey="field_name"
                    size="small"
                    pagination={false}
                    dataSource={latest?.fields ?? []}
                    columns={[
                      { title: "Trường", dataIndex: "field_name", width: 220 },
                      { title: "Kiểu", dataIndex: "data_type", width: 120 },
                      {
                        title: "Hiển thị",
                        key: "mask",
                        width: 170,
                        render: (_, row) =>
                          !row.exposed ? (
                            <Tag>Không lộ</Tag>
                          ) : row.mask_strategy === "NONE" ? (
                            <Tag color="green">Nguyên bản</Tag>
                          ) : (
                            <Tooltip title="Trường nhạy cảm bắt buộc phải che">
                              <Tag color="orange">
                                {MASK_OPTIONS.find((m) => m.value === row.mask_strategy)
                                  ?.label ?? row.mask_strategy}
                              </Tag>
                            </Tooltip>
                          ),
                      },
                      {
                        title: "Lọc được",
                        dataIndex: "filterable",
                        width: 110,
                        render: (value: boolean) => (value ? "có" : "không"),
                      },
                      {
                        title: "Sắp xếp được",
                        dataIndex: "sortable",
                        width: 130,
                        render: (value: boolean) => (value ? "có" : "không"),
                      },
                    ]}
                  />
                ),
              },
              {
                key: "versions",
                label: `Phiên bản (${product.versions?.length ?? 0})`,
                children: (
                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={product.versions ?? []}
                    columns={[
                      { title: "Phiên bản", dataIndex: "version", width: 100 },
                      {
                        title: "Trạng thái",
                        dataIndex: "status",
                        width: 130,
                        render: (value: string) => (
                          <Tag color={STATUS_COLOR[value]}>{value}</Tag>
                        ),
                      },
                      { title: "Schema dataset", dataIndex: "dataset_version", width: 140 },
                      { title: "Người review", dataIndex: "reviewed_by", width: 160 },
                      { title: "Ghi chú review", dataIndex: "review_note" },
                      {
                        title: "Publish lúc",
                        dataIndex: "published_at",
                        width: 170,
                        render: formatTime,
                      },
                    ]}
                  />
                ),
              },
              {
                key: "openapi",
                label: "OpenAPI",
                children: spec ? (
                  <pre className="bg-gray-50 p-3 rounded text-xs max-h-[520px] overflow-auto">
                    {spec}
                  </pre>
                ) : (
                  <Empty description="Chưa có phiên bản" />
                ),
              },
              {
                key: "usage",
                label: `Nhật ký (${usage.length})`,
                children: (
                  <Table
                    rowKey={(row) => `${row.occurred_at}-${row.client_id}-${row.status_code}`}
                    size="small"
                    pagination={{ pageSize: 20 }}
                    dataSource={usage}
                    locale={{ emptyText: "Không có hoặc thiếu quyền audit.read" }}
                    columns={[
                      {
                        title: "Thời điểm",
                        dataIndex: "occurred_at",
                        width: 180,
                        render: formatTime,
                      },
                      { title: "Client", dataIndex: "client_id", width: 160 },
                      { title: "Endpoint", dataIndex: "endpoint" },
                      {
                        title: "Kết quả",
                        key: "result",
                        width: 150,
                        render: (_, row) => (
                          <Tag color={row.result === "SUCCESS" ? "green" : "red"}>
                            {row.status_code} {row.denial_reason ?? ""}
                          </Tag>
                        ),
                      },
                      { title: "Số dòng", dataIndex: "rows_returned", width: 100 },
                      { title: "ms", dataIndex: "duration_ms", width: 80 },
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
