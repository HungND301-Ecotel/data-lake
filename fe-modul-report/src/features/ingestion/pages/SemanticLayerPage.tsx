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
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { PlusOutlined, ReloadOutlined, ThunderboltOutlined } from "@ant-design/icons";
import semanticApi, {
  type Aggregation,
  type MetricResult,
  type MetricRunRow,
  type SemanticMetric,
} from "../api/semanticApi";
import catalogApi, { type Dataset, type DatasetField } from "../api/catalogApi";
import { formatTime } from "../components/statusTags";
import { useHasPermission } from "../../../stores/authStore";

const { Text, Paragraph } = Typography;

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "default",
  APPROVED: "green",
  RETIRED: "red",
};

const AGGREGATIONS: Aggregation[] = [
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "COUNT",
  "COUNT_DISTINCT",
];

export default function SemanticLayerPage() {
  const canManage = useHasPermission("catalog.manage");

  const [metrics, setMetrics] = useState<SemanticMetric[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [fields, setFields] = useState<DatasetField[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<SemanticMetric | null>(null);
  const [result, setResult] = useState<MetricResult | null>(null);
  const [runs, setRuns] = useState<MetricRunRow[]>([]);
  const [form] = Form.useForm();
  const datasetCode = Form.useWatch("dataset_code", form);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, page] = await Promise.all([
        semanticApi.list(),
        catalogApi.listDatasets({ status: "PUBLISHED", size: 200 }),
      ]);
      setMetrics(list.items);
      // Chỉ dataset Gold mới định nghĩa chỉ tiêu được.
      setDatasets(page.items.filter((d) => d.namespace.startsWith("gold")));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!datasetCode) {
      setFields([]);
      return;
    }
    catalogApi.getDataset(datasetCode).then((dataset) => {
      // Schema nằm ở phiên bản mới nhất của dataset.
      const latest = dataset.versions?.[dataset.versions.length - 1];
      setFields(latest?.fields ?? []);
    });
  }, [datasetCode]);

  const usableFields = fields.filter((f) => !f.is_pii && !f.is_secret);

  const create = async () => {
    const values = await form.validateFields();
    try {
      await semanticApi.define(values);
      message.success("Đã tạo chỉ tiêu ở trạng thái nháp, chờ người khác duyệt");
      setCreateOpen(false);
      form.resetFields();
      await load();
    } catch (error) {
      message.error(readError(error, "Không tạo được chỉ tiêu"));
    }
  };

  const approve = async (metric: SemanticMetric) => {
    try {
      await semanticApi.approve(metric.code);
      message.success("Đã duyệt");
      await load();
    } catch (error) {
      message.error(readError(error, "Không duyệt được"));
    }
  };

  const retire = (metric: SemanticMetric) => {
    let reason = "";
    Modal.confirm({
      title: `Ngừng dùng ${metric.code}?`,
      content: (
        <Input.TextArea
          rows={3}
          placeholder="Lý do (bắt buộc)"
          onChange={(e) => (reason = e.target.value)}
        />
      ),
      okText: "Ngừng dùng",
      okButtonProps: { danger: true },
      cancelText: "Huỷ",
      onOk: async () => {
        await semanticApi.retire(metric.code, reason);
        await load();
      },
    });
  };

  const open = async (metric: SemanticMetric) => {
    setSelected(metric);
    setResult(null);
    try {
      setRuns((await semanticApi.runs(metric.code)).items);
    } catch {
      // Nhật ký cần quyền audit.read; không có thì để trống.
      setRuns([]);
    }
  };

  const run = async (dimension?: string) => {
    if (!selected) return;
    try {
      setResult(await semanticApi.run(selected.code, { dimension }));
    } catch (error) {
      message.error(readError(error, "Không chạy được"));
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="Tầng ngữ nghĩa"
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
                Khai báo chỉ tiêu
              </Button>
            )}
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          className="mb-4"
          message="Trợ lý AI không viết truy vấn. Nó chọn một chỉ tiêu ở đây và điền tham số lấy từ chính danh sách chỉ tiêu đó khai báo."
          description="Nhờ vậy không có câu lệnh nào được sinh ra từ output của mô hình. Trường gắn nhãn PII hoặc MẬT không dùng làm chỉ tiêu hay chiều phân tích được, và mỗi chỉ tiêu phải được người thứ hai duyệt trước khi chạy."
        />

        <Table
          rowKey="id"
          size="small"
          loading={loading}
          dataSource={metrics}
          onRow={(row) => ({ onClick: () => open(row) })}
          rowClassName="cursor-pointer"
          locale={{ emptyText: <Empty description="Chưa khai báo chỉ tiêu nào" /> }}
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
            {
              title: "Công thức",
              key: "formula",
              render: (_, row) => (
                <Text code className="text-xs">
                  {row.aggregation}
                  {row.measure_field ? `(${row.measure_field})` : "(*)"}
                  {row.unit ? ` ${row.unit}` : ""}
                </Text>
              ),
            },
            { title: "Dataset", dataIndex: "dataset_code" },
            {
              title: "Chiều cho phép",
              dataIndex: "dimensions",
              render: (dimensions: string[]) =>
                dimensions.length ? (
                  <Space size={4} wrap>
                    {dimensions.map((d) => (
                      <Tag key={d}>{d}</Tag>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">—</Text>
                ),
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 190,
              render: (status: string, row) => (
                <Space direction="vertical" size={0}>
                  <Tag color={STATUS_COLOR[status]}>{status}</Tag>
                  {row.approved_by && (
                    <Text type="secondary" className="text-xs">
                      duyệt bởi {row.approved_by}
                    </Text>
                  )}
                </Space>
              ),
            },
            {
              title: "",
              key: "actions",
              width: 200,
              render: (_, row) =>
                canManage ? (
                  <Space onClick={(e) => e.stopPropagation()}>
                    {row.status === "DRAFT" && (
                      <Button size="small" onClick={() => approve(row)}>
                        Duyệt
                      </Button>
                    )}
                    {row.status === "APPROVED" && (
                      <Button size="small" danger onClick={() => retire(row)}>
                        Ngừng dùng
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
        title="Khai báo chỉ tiêu"
        width={620}
        onCancel={() => setCreateOpen(false)}
        onOk={create}
        okText="Tạo"
        cancelText="Huỷ"
      >
        <Form form={form} layout="vertical" initialValues={{ aggregation: "SUM" }}>
          <Form.Item name="code" label="Mã chỉ tiêu" rules={[{ required: true }]}>
            <Input placeholder="tong_san_luong" />
          </Form.Item>
          <Form.Item name="name" label="Tên hiển thị">
            <Input placeholder="Tổng sản lượng" />
          </Form.Item>
          <Form.Item
            name="synonyms"
            label="Từ khoá định tuyến"
            extra="Trợ lý dùng những từ này để chọn đúng chỉ tiêu; phân tách bằng dấu phẩy."
          >
            <Input placeholder="sản lượng, sản xuất, tổng sản lượng" />
          </Form.Item>
          <Form.Item
            name="dataset_code"
            label="Dataset nguồn (Gold, đã công bố)"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              options={datasets.map((d) => ({
                value: d.code,
                label: `${d.code} · ${d.namespace}`,
              }))}
              notFoundContent={<Empty description="Chưa có dataset Gold nào công bố" />}
            />
          </Form.Item>
          <Form.Item name="aggregation" label="Phép tổng hợp">
            <Select options={AGGREGATIONS.map((a) => ({ value: a, label: a }))} />
          </Form.Item>
          <Form.Item
            name="measure_field"
            label="Cột được tổng hợp"
            extra="Trường gắn nhãn PII hoặc MẬT không xuất hiện trong danh sách này."
          >
            <Select
              showSearch
              allowClear
              options={usableFields.map((f) => ({ value: f.name, label: f.name }))}
            />
          </Form.Item>
          <Form.Item name="unit" label="Đơn vị">
            <Input placeholder="tấn" />
          </Form.Item>
          <Form.Item name="dimensions" label="Chiều phân tích cho phép">
            <Select
              mode="multiple"
              options={usableFields.map((f) => ({ value: f.name, label: f.name }))}
            />
          </Form.Item>
          <Form.Item name="filters" label="Trường được lọc">
            <Select
              mode="multiple"
              options={usableFields.map((f) => ({ value: f.name, label: f.name }))}
            />
          </Form.Item>
          <Space>
            <Form.Item
              name="max_rows_scanned"
              label="Trần số dòng đọc"
              extra="Vượt trần thì từ chối, không cắt bớt."
            >
              <InputNumber min={1} />
            </Form.Item>
            <Form.Item name="max_groups" label="Trần số nhóm">
              <InputNumber min={1} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Drawer
        open={!!selected}
        width={820}
        title={selected ? `${selected.code} · ${selected.name}` : ""}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <Tabs
            items={[
              {
                key: "run",
                label: "Chạy thử",
                children: (
                  <Space direction="vertical" className="w-full">
                    <Descriptions size="small" column={2} bordered>
                      <Descriptions.Item label="Công thức">
                        <Text code>
                          {selected.aggregation}
                          {selected.measure_field ? `(${selected.measure_field})` : "(*)"}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Dataset">
                        {selected.dataset_code}
                      </Descriptions.Item>
                      <Descriptions.Item label="Trần dòng">
                        {selected.max_rows_scanned}
                      </Descriptions.Item>
                      <Descriptions.Item label="Trần nhóm">
                        {selected.max_groups}
                      </Descriptions.Item>
                    </Descriptions>

                    <Space wrap>
                      <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        onClick={() => run()}
                        disabled={selected.status !== "APPROVED"}
                      >
                        Tổng chung
                      </Button>
                      {selected.dimensions.map((dimension) => (
                        <Button
                          key={dimension}
                          onClick={() => run(dimension)}
                          disabled={selected.status !== "APPROVED"}
                        >
                          Theo {dimension}
                        </Button>
                      ))}
                    </Space>

                    {selected.status !== "APPROVED" && (
                      <Alert
                        type="warning"
                        showIcon
                        message="Chỉ tiêu chưa được duyệt nên chưa chạy được."
                      />
                    )}

                    {result && (
                      <>
                        {result.partial && (
                          <Alert
                            type="warning"
                            showIcon
                            message={result.partial_note}
                            description="Đừng dùng con số này như tổng toàn đơn vị."
                          />
                        )}
                        <Space wrap>
                          <Statistic
                            title={result.dimension ? "Số nhóm" : "Giá trị"}
                            value={
                              result.dimension
                                ? result.groups
                                : (result.items[0]?.value ?? 0)
                            }
                            suffix={result.dimension ? "" : (result.unit ?? "")}
                          />
                          <Statistic title="Dòng đã đọc" value={result.rows_scanned} />
                          <Statistic title="Thời gian" value={result.duration_ms} suffix="ms" />
                        </Space>
                        <Text type="secondary" className="text-xs">
                          Nguồn: {result.dataset} v{result.dataset_version} · tính lúc{" "}
                          {formatTime(result.computed_at)} · checksum{" "}
                          {result.checksum.slice(0, 12)}…
                        </Text>
                        <Table
                          rowKey={(row) => String(row.group)}
                          size="small"
                          dataSource={result.items}
                          pagination={{ pageSize: 10 }}
                          columns={[
                            {
                              title: result.dimension ?? "Toàn bộ",
                              dataIndex: "group",
                              render: (group: string | null) => group ?? "—",
                            },
                            {
                              title: "Giá trị",
                              dataIndex: "value",
                              render: (value: number) =>
                                `${value.toLocaleString("vi-VN")}${
                                  result.unit ? ` ${result.unit}` : ""
                                }`,
                            },
                            { title: "Số dòng", dataIndex: "rows", width: 100 },
                          ]}
                        />
                      </>
                    )}
                  </Space>
                ),
              },
              {
                key: "definition",
                label: "Khai báo",
                children: (
                  <Descriptions size="small" column={1} bordered>
                    <Descriptions.Item label="Mô tả">
                      {selected.description ?? "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Từ khoá định tuyến">
                      {selected.synonyms ?? "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Chiều cho phép">
                      {selected.dimensions.join(", ") || "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trường được lọc">
                      {selected.filters.join(", ") || "—"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Chủ sở hữu">
                      {selected.owner_user}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người định nghĩa / người duyệt">
                      {selected.created_by} / {selected.approved_by ?? "chưa duyệt"}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: "runs",
                label: `Nhật ký (${runs.length})`,
                children: (
                  <>
                    <Paragraph type="secondary">
                      Nhật ký ghi tham số và checksum kết quả, không ghi dữ liệu — đủ để
                      chấm lại độ chính xác của công cụ SQL về sau.
                    </Paragraph>
                    <Table
                      rowKey={(_, index) => String(index)}
                      size="small"
                      dataSource={runs}
                      locale={{
                        emptyText: (
                          <Empty description="Chưa có lần chạy nào, hoặc bạn không có quyền đọc nhật ký" />
                        ),
                      }}
                      columns={[
                        {
                          title: "Lúc",
                          dataIndex: "executed_at",
                          width: 175,
                          render: formatTime,
                        },
                        { title: "Người chạy", dataIndex: "executed_by", width: 130 },
                        {
                          title: "Tham số",
                          dataIndex: "parameters",
                          render: (params: Record<string, unknown>) => (
                            <Text code className="text-xs">
                              {JSON.stringify(params)}
                            </Text>
                          ),
                        },
                        { title: "Dòng", dataIndex: "rows_scanned", width: 80 },
                        {
                          title: "",
                          dataIndex: "partial",
                          width: 110,
                          render: (partial: boolean) =>
                            partial ? (
                              <Tooltip title="Chỉ tính trên phần người chạy được đọc">
                                <Tag color="orange">chưa đầy đủ</Tag>
                              </Tooltip>
                            ) : null,
                        },
                      ]}
                    />
                  </>
                ),
              },
            ]}
          />
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
