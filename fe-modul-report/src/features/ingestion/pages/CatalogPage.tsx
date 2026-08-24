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
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import catalogApi, {
  type Dataset,
  type DatasetVersion,
  type GlossaryTerm,
  type ImpactResult,
  type LineageGraph,
} from "../api/catalogApi";
import { useIngestionRefData } from "../hooks/useIngestionRefData";
import { formatTime } from "../components/statusTags";

const { Text, Paragraph } = Typography;

const NAMESPACES = [
  "bronze",
  "silver",
  "gold_report",
  "gold_bi",
  "gold_api",
  "gold_ai",
  "gold_approved_kg",
  "gold_public",
];

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "default",
  PUBLISHED: "green",
  DEPRECATED: "orange",
  RETIRED: "red",
};

const CHANGE_COLOR: Record<string, string> = {
  INITIAL: "blue",
  ADDITIVE: "green",
  BREAKING: "red",
};

export default function CatalogPage() {
  const { labels, organizations } = useIngestionRefData();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [glossary, setGlossary] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [namespace, setNamespace] = useState<string | undefined>();
  const [selected, setSelected] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form] = Form.useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, g] = await Promise.all([
        catalogApi.listDatasets({ q: search || undefined, namespace, size: 100 }),
        catalogApi.listGlossary(),
      ]);
      setDatasets(d.items);
      setGlossary(g.items);
    } finally {
      setLoading(false);
    }
  }, [search, namespace]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    const values = await form.validateFields();
    await catalogApi.createDataset({
      ...values,
      derived_from: values.derived_from,
    });
    message.success("Đã tạo dataset ở trạng thái nháp");
    setCreateOpen(false);
    form.resetFields();
    load();
  };

  return (
    <div className="space-y-4">
      <Card
        title="Danh mục dữ liệu"
        extra={
          <Space>
            <Input.Search
              allowClear
              placeholder="Tìm theo mã, tên, mô tả"
              style={{ width: 240 }}
              onSearch={setSearch}
            />
            <Select
              allowClear
              placeholder="Namespace"
              style={{ width: 180 }}
              value={namespace}
              onChange={setNamespace}
              options={NAMESPACES.map((n) => ({ value: n, label: n }))}
            />
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Làm mới
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Đăng ký dataset
            </Button>
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Dataset chỉ công bố được khi đã có chủ sở hữu, nhãn bảo mật, schema và cam kết độ tươi dữ liệu."
          description="Thay đổi schema được hệ thống tự phân loại: bỏ cột, đổi kiểu hoặc siết ràng buộc là thay đổi phá vỡ và sẽ tăng major, đồng thời cảnh báo các bên đang dùng."
        />

        <Tabs
          items={[
            {
              key: "datasets",
              label: `Dataset (${datasets.length})`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  loading={loading}
                  dataSource={datasets}
                  onRow={(row) => ({ onClick: () => setSelected(row.code) })}
                  rowClassName="cursor-pointer"
                  columns={[
                    {
                      title: "Mã",
                      dataIndex: "code",
                      width: 220,
                      render: (value: string, row) => (
                        <Space direction="vertical" size={0}>
                          <Text strong>{value}</Text>
                          <Text type="secondary" className="text-xs">
                            {row.name}
                          </Text>
                        </Space>
                      ),
                    },
                    {
                      title: "Namespace",
                      dataIndex: "namespace",
                      width: 150,
                      render: (value: string) => <Tag>{value}</Tag>,
                    },
                    {
                      title: "Trạng thái",
                      dataIndex: "status",
                      width: 130,
                      render: (value: string) => (
                        <Tag color={STATUS_COLOR[value]}>{value}</Tag>
                      ),
                    },
                    {
                      title: "Phiên bản",
                      dataIndex: "current_version",
                      width: 110,
                      render: (value: string | null) =>
                        value ? <Tag color="green">v{value}</Tag> : "—",
                    },
                    { title: "Chủ sở hữu", dataIndex: "owner_user", width: 150 },
                    {
                      title: "Độ tươi",
                      dataIndex: "sla_freshness_hours",
                      width: 110,
                      render: (value: number | null) =>
                        value ? `${value} giờ` : <Text type="secondary">—</Text>,
                    },
                    {
                      title: "Mức mật",
                      dataIndex: "security_level",
                      width: 100,
                      render: (value: number) => (
                        <Tag color={value >= 3 ? "red" : "blue"}>{value}</Tag>
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: "glossary",
              label: `Thuật ngữ (${glossary.length})`,
              children: (
                <GlossaryTab terms={glossary} onChanged={load} />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Đăng ký dataset"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={create}
        width={640}
      >
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="code" label="Mã" rules={[{ required: true }]}>
              <Input placeholder="gold_san_luong_thang" />
            </Form.Item>
            <Form.Item name="name" label="Tên">
              <Input />
            </Form.Item>
            <Form.Item name="namespace" label="Namespace" rules={[{ required: true }]}>
              <Select options={NAMESPACES.map((n) => ({ value: n, label: n }))} />
            </Form.Item>
            <Form.Item name="owner_org_id" label="Đơn vị sở hữu">
              <Select
                allowClear
                options={organizations.map((o) => ({
                  value: o.id,
                  label: `${o.name} (${o.code})`,
                }))}
              />
            </Form.Item>
            <Form.Item name="security_label_id" label="Nhãn bảo mật">
              <Select
                allowClear
                options={labels.map((l) => ({ value: l.id, label: l.name }))}
              />
            </Form.Item>
            <Form.Item
              name="sla_freshness_hours"
              label="Cam kết độ tươi (giờ)"
              extra="Bắt buộc với namespace gold_*"
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="derived_from"
            label="Dẫn xuất từ"
            extra="Tag PII của dataset cha sẽ được kế thừa sang schema mới"
          >
            <Select
              mode="multiple"
              allowClear
              options={datasets.map((d) => ({ value: d.code, label: d.code }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <DatasetDrawer
        code={selected}
        onClose={() => setSelected(null)}
        onChanged={load}
      />
    </div>
  );
}

function GlossaryTab({ terms, onChanged }: { terms: GlossaryTerm[]; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  return (
    <>
      <Space className="mb-3">
        <Button type="primary" onClick={() => setOpen(true)}>
          Thêm thuật ngữ
        </Button>
      </Space>
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        dataSource={terms}
        columns={[
          { title: "Mã", dataIndex: "code", width: 180 },
          { title: "Tên", dataIndex: "name", width: 200 },
          { title: "Định nghĩa", dataIndex: "definition" },
          { title: "Chủ sở hữu", dataIndex: "owner_user", width: 150 },
        ]}
      />

      <Modal
        title="Thêm thuật ngữ"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={async () => {
          const values = await form.validateFields();
          await catalogApi.createTerm(values);
          message.success("Đã thêm thuật ngữ");
          setOpen(false);
          form.resetFields();
          onChanged();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Mã" rules={[{ required: true }]}>
            <Input placeholder="SAN_LUONG" />
          </Form.Item>
          <Form.Item name="name" label="Tên">
            <Input />
          </Form.Item>
          <Form.Item name="definition" label="Định nghĩa" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="synonyms" label="Từ đồng nghĩa">
            <Input placeholder="phân tách bằng dấu phẩy" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

function DatasetDrawer({
  code,
  onClose,
  onChanged,
}: {
  code: string | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [impact, setImpact] = useState<ImpactResult | null>(null);
  const [lineage, setLineage] = useState<LineageGraph | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    try {
      const detail = await catalogApi.getDataset(code);
      setDataset(detail);
      const [impactResult, lineageResult] = await Promise.all([
        catalogApi.impact(code),
        catalogApi.lineage("dataset", detail.id, 4),
      ]);
      setImpact(impactResult);
      setLineage(lineageResult);
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    setDataset(null);
    setImpact(null);
    setLineage(null);
    load();
  }, [load]);

  const publish = async () => {
    if (!dataset) return;
    await catalogApi.publish(dataset.code);
    message.success("Đã công bố dataset");
    await load();
    onChanged();
  };

  const deprecate = async () => {
    if (!dataset) return;
    const note = window.prompt("Lý do ngừng sử dụng (bắt buộc)") || "";
    if (!note.trim()) {
      message.warning("Ngừng sử dụng phải kèm lý do");
      return;
    }
    const days = Number(window.prompt("Số ngày chuyển đổi cho consumer", "30") || 30);
    const result = await catalogApi.deprecate(dataset.code, note, days);
    message.success(
      `Đã đánh dấu ngừng sử dụng, ${result.notified_consumers.length} bên cần thông báo`
    );
    await load();
    onChanged();
  };

  const latest: DatasetVersion | undefined = dataset?.versions?.[0];

  return (
    <Drawer
      title={dataset ? `${dataset.code} · ${dataset.name}` : "Chi tiết dataset"}
      width={900}
      open={Boolean(code)}
      onClose={onClose}
      extra={
        dataset && (
          <Space>
            {dataset.status === "DRAFT" && (
              <Button type="primary" onClick={publish}>
                Công bố
              </Button>
            )}
            {dataset.status === "PUBLISHED" && (
              <Button danger onClick={deprecate}>
                Ngừng sử dụng
              </Button>
            )}
          </Space>
        )
      }
    >
      {!dataset ? (
        <Empty description={loading ? "Đang tải" : "Không có dữ liệu"} />
      ) : (
        <>
          {dataset.status === "DEPRECATED" && (
            <Alert
              type="warning"
              showIcon
              className="mb-4"
              message={`Ngừng sử dụng từ ${formatTime(dataset.deprecated_at)}`}
              description={`${dataset.deprecation_note ?? ""} — hạn chuyển đổi đến ${formatTime(
                dataset.retire_after
              )}`}
            />
          )}
          {latest?.change_type === "BREAKING" && (
            <Alert
              type="error"
              showIcon
              className="mb-4"
              message={`Phiên bản ${latest.version} là thay đổi phá vỡ`}
              description={
                <ul className="m-0 pl-4">
                  {latest.change_detail?.removed.map((f) => (
                    <li key={`r-${f}`}>Bỏ cột: {f}</li>
                  ))}
                  {latest.change_detail?.type_changed.map((c) => (
                    <li key={`t-${c.field}`}>
                      Đổi kiểu {c.field}: {c.from} → {c.to}
                    </li>
                  ))}
                  {latest.change_detail?.narrowed.map((f) => (
                    <li key={`n-${f}`}>Siết ràng buộc NOT NULL: {f}</li>
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
                    <Descriptions.Item label="Namespace">
                      <Tag>{dataset.namespace}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      <Tag color={STATUS_COLOR[dataset.status]}>{dataset.status}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Phiên bản hiện hành">
                      {dataset.current_version ?? "chưa công bố"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Chủ sở hữu">
                      {dataset.owner_user ?? "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mức độ mật">
                      <Tag color={dataset.security_level >= 3 ? "red" : "blue"}>
                        {dataset.security_level}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Cam kết độ tươi">
                      {dataset.sla_freshness_hours
                        ? `${dataset.sla_freshness_hours} giờ`
                        : "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Mô tả" span={2}>
                      {dataset.description ?? "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Quy tắc chất lượng" span={2}>
                      {dataset.quality_rules ?? "—"}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: "schema",
                label: `Schema (${latest?.fields.length ?? 0})`,
                children: (
                  <Table
                    rowKey="name"
                    size="small"
                    pagination={false}
                    dataSource={latest?.fields ?? []}
                    columns={[
                      { title: "Trường", dataIndex: "name", width: 220 },
                      { title: "Kiểu", dataIndex: "data_type", width: 130 },
                      {
                        title: "Nullable",
                        dataIndex: "nullable",
                        width: 100,
                        render: (value: boolean) => (value ? "có" : "không"),
                      },
                      {
                        title: "Phân loại",
                        key: "tags",
                        width: 180,
                        render: (_, row) => (
                          <Space size={4} wrap>
                            {row.is_pii && (
                              <Tooltip title="Dữ liệu cá nhân; tag được kế thừa xuống downstream">
                                <Tag color="orange">PII</Tag>
                              </Tooltip>
                            )}
                            {row.is_secret && <Tag color="red">MẬT</Tag>}
                            {row.tags && <Tag>{row.tags}</Tag>}
                          </Space>
                        ),
                      },
                      { title: "Mô tả", dataIndex: "description" },
                    ]}
                  />
                ),
              },
              {
                key: "versions",
                label: `Phiên bản (${dataset.versions?.length ?? 0})`,
                children: (
                  <Table
                    rowKey="id"
                    size="small"
                    pagination={false}
                    dataSource={dataset.versions ?? []}
                    columns={[
                      { title: "Phiên bản", dataIndex: "version", width: 110 },
                      {
                        title: "Loại thay đổi",
                        dataIndex: "change_type",
                        width: 140,
                        render: (value: string) => (
                          <Tag color={CHANGE_COLOR[value]}>{value}</Tag>
                        ),
                      },
                      {
                        title: "Trạng thái",
                        dataIndex: "status",
                        width: 120,
                        render: (value: string) => <Tag>{value}</Tag>,
                      },
                      { title: "Ghi chú", dataIndex: "change_note" },
                      {
                        title: "Công bố",
                        dataIndex: "published_at",
                        width: 170,
                        render: formatTime,
                      },
                    ]}
                  />
                ),
              },
              {
                key: "impact",
                label: `Ảnh hưởng (${impact?.total_affected ?? 0})`,
                children: (
                  <Space direction="vertical" className="w-full" size="middle">
                    <div>
                      <Text strong>Dataset phụ thuộc</Text>
                      <Table
                        rowKey="code"
                        size="small"
                        pagination={false}
                        className="mt-2"
                        dataSource={impact?.downstream_datasets ?? []}
                        locale={{ emptyText: "Không có" }}
                        columns={[
                          { title: "Mã", dataIndex: "code" },
                          { title: "Namespace", dataIndex: "namespace", width: 150 },
                          { title: "Trạng thái", dataIndex: "status", width: 130 },
                          { title: "Chủ sở hữu", dataIndex: "owner_user", width: 150 },
                        ]}
                      />
                    </div>
                    <div>
                      <Text strong>Bên đang sử dụng</Text>
                      <Table
                        rowKey="ref"
                        size="small"
                        pagination={false}
                        className="mt-2"
                        dataSource={impact?.consumers ?? []}
                        locale={{ emptyText: "Không có" }}
                        columns={[
                          { title: "Loại", dataIndex: "type", width: 110 },
                          { title: "Định danh", dataIndex: "ref" },
                          {
                            title: "Phiên bản đang dùng",
                            dataIndex: "subscribed_version",
                            width: 170,
                          },
                          { title: "Liên hệ", dataIndex: "contact", width: 200 },
                        ]}
                      />
                    </div>
                  </Space>
                ),
              },
              {
                key: "lineage",
                label: `Nguồn gốc (${lineage?.edges.length ?? 0})`,
                children: lineage?.edges.length ? (
                  <Table
                    rowKey={(row) =>
                      `${row.source_type}:${row.source_id}->${row.target_type}:${row.target_id}`
                    }
                    size="small"
                    pagination={false}
                    dataSource={lineage.edges}
                    columns={[
                      {
                        title: "Nguồn",
                        key: "source",
                        render: (_, row) => (
                          <Text className="text-xs">
                            {row.source_type} · {row.source_id.slice(0, 8)}…
                          </Text>
                        ),
                      },
                      {
                        title: "Quan hệ",
                        dataIndex: "kind",
                        width: 150,
                        render: (value: string) => <Tag>{value}</Tag>,
                      },
                      {
                        title: "Đích",
                        key: "target",
                        render: (_, row) => (
                          <Text className="text-xs">
                            {row.target_type} · {row.target_id.slice(0, 8)}…
                          </Text>
                        ),
                      },
                      { title: "Chi tiết", dataIndex: "detail" },
                    ]}
                  />
                ) : (
                  <Empty description="Chưa có quan hệ nguồn gốc" />
                ),
              },
            ]}
          />

          {latest && (
            <Paragraph type="secondary" className="text-xs mt-4 mb-0">
              Schema hiện tại do {latest.created_by} khai báo lúc{" "}
              {formatTime(latest.created_at)}.
            </Paragraph>
          )}
        </>
      )}
    </Drawer>
  );
}
