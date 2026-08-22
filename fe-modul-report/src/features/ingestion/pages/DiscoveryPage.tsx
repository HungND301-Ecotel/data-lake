import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  AutoComplete,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Input,
  List,
  Modal,
  Row,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { ReloadOutlined, SaveOutlined, SearchOutlined } from "@ant-design/icons";
import searchApi, {
  type SearchHit,
  type SearchKind,
  type SearchPreview,
  type SearchResponse,
  type SavedQuery,
} from "../api/searchApi";
import { formatTime } from "../components/statusTags";
import { useHasPermission } from "../../../stores/authStore";

const { Text, Paragraph, Title } = Typography;

const KIND_LABEL: Record<SearchKind, string> = {
  CHUNK: "Nội dung tài liệu",
  OBJECT: "Tệp đã tải lên",
  DATASET: "Dataset",
  GLOSSARY: "Thuật ngữ",
};

const KIND_COLOR: Record<SearchKind, string> = {
  CHUNK: "blue",
  OBJECT: "geekblue",
  DATASET: "green",
  GLOSSARY: "purple",
};

const ALL_KINDS: SearchKind[] = ["CHUNK", "OBJECT", "DATASET", "GLOSSARY"];

/**
 * Máy chủ đánh dấu chỗ khớp bằng [[...]] thay vì HTML, nên nội dung tài liệu
 * không bao giờ được diễn giải như thẻ. Việc tô đậm làm ở đây.
 */
function Highlighted({ text }: { text: string }) {
  const parts = useMemo(() => text.split(/(\[\[.*?\]\])/g), [text]);
  return (
    <span>
      {parts.map((part, index) =>
        part.startsWith("[[") && part.endsWith("]]") ? (
          <mark key={index} className="bg-yellow-200 px-0.5">
            {part.slice(2, -2)}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
}

export default function DiscoveryPage() {
  const canReindex = useHasPermission("admin.manage");

  const [query, setQuery] = useState("");
  const [kinds, setKinds] = useState<SearchKind[]>([]);
  const [useVector, setUseVector] = useState(true);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<{ value: string }[]>([]);
  const [saved, setSaved] = useState<SavedQuery[]>([]);
  const [preview, setPreview] = useState<SearchPreview | null>(null);

  const loadSaved = useCallback(async () => {
    setSaved((await searchApi.listSaved()).items);
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const run = async (text = query, overrideKinds = kinds, vector = useVector) => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setResult(
        await searchApi.search({
          q: text,
          kinds: overrideKinds.length ? overrideKinds : undefined,
          vector,
          limit: 20,
        })
      );
    } catch (caught) {
      setResult(null);
      setError(readError(caught, "Không tìm được"));
    } finally {
      setLoading(false);
    }
  };

  const complete = async (value: string) => {
    setQuery(value);
    const last = value.split(/\s+/).pop() ?? "";
    if (last.length < 2) {
      setOptions([]);
      return;
    }
    const prefix = value.slice(0, value.length - last.length);
    const suggestions = await searchApi.suggest(last);
    setOptions(suggestions.items.map((s) => ({ value: prefix + s.term })));
  };

  const openPreview = async (hit: SearchHit) => {
    setPreview(await searchApi.preview(hit.document_id, query));
  };

  const save = () => {
    let name = "";
    Modal.confirm({
      title: "Lưu truy vấn này",
      content: (
        <Space direction="vertical" className="w-full">
          <Text type="secondary">
            Truy vấn đã lưu là của riêng bạn; người khác không nhìn thấy.
          </Text>
          <Input placeholder="Tên gợi nhớ" onChange={(e) => (name = e.target.value)} />
        </Space>
      ),
      okText: "Lưu",
      cancelText: "Huỷ",
      onOk: async () => {
        await searchApi.save({
          name,
          q: query,
          filters: { kinds, vector: useVector },
        });
        message.success("Đã lưu");
        await loadSaved();
      },
    });
  };

  const runSaved = async (record: SavedQuery) => {
    setQuery(record.q);
    const filters = record.filters as { kinds?: SearchKind[]; vector?: boolean };
    setKinds(filters.kinds ?? []);
    setUseVector(filters.vector ?? true);
    setLoading(true);
    try {
      setResult(await searchApi.runSaved(record.id));
      setError(null);
    } catch (caught) {
      setError(readError(caught, "Không chạy được truy vấn đã lưu"));
    } finally {
      setLoading(false);
      await loadSaved();
    }
  };

  const reindex = async () => {
    const counts = await searchApi.reindex();
    message.success(
      `Đã lập chỉ mục ${counts.chunks} đoạn, ${counts.objects} tệp, ${counts.datasets} dataset`
    );
    if (query) await run();
  };

  return (
    <div className="space-y-4">
      <Card
        title="Tìm kiếm & khám phá"
        extra={
          canReindex && (
            <Button icon={<ReloadOutlined />} onClick={reindex}>
              Dựng lại index
            </Button>
          )
        }
      >
        <Space direction="vertical" className="w-full" size="middle">
          <Space.Compact className="w-full">
            <AutoComplete
              className="w-full"
              value={query}
              options={options}
              onChange={complete}
              onSelect={(value) => {
                setQuery(value);
                run(value);
              }}
            >
              <Input
                size="large"
                placeholder="Từ khoá, số hiệu văn bản, mã dataset…"
                onPressEnter={() => run()}
                prefix={<SearchOutlined />}
              />
            </AutoComplete>
            <Button size="large" type="primary" onClick={() => run()} loading={loading}>
              Tìm
            </Button>
            <Button size="large" icon={<SaveOutlined />} onClick={save} disabled={!query}>
              Lưu
            </Button>
          </Space.Compact>

          <Space wrap>
            <Checkbox
              checked={useVector}
              onChange={(e) => {
                setUseVector(e.target.checked);
                if (query) run(query, kinds, e.target.checked);
              }}
            >
              <Tooltip title="Tắt đi để chỉ tìm đúng chữ, không tìm theo nghĩa gần">
                Kèm tìm theo ngữ nghĩa
              </Tooltip>
            </Checkbox>
            <Checkbox.Group
              value={kinds}
              onChange={(value) => {
                setKinds(value as SearchKind[]);
                if (query) run(query, value as SearchKind[]);
              }}
              options={ALL_KINDS.map((kind) => ({
                label: KIND_LABEL[kind],
                value: kind,
              }))}
            />
          </Space>

          {error && <Alert type="warning" showIcon message={error} />}

          {result?.index.stale && (
            <Alert
              type="warning"
              showIcon
              message="Index đang cũ"
              description={`Lần lập chỉ mục gần nhất: ${formatTime(
                result.index.last_indexed_at
              )}. Kết quả có thể chưa phản ánh dữ liệu mới nhất.`}
            />
          )}
        </Space>
      </Card>

      <Row gutter={16}>
        <Col span={17}>
          <Card
            title={
              result
                ? `${result.total} kết quả · ${result.took_ms} ms · ${result.tools.join(" + ")}`
                : "Kết quả"
            }
          >
            {loading ? (
              <div className="py-12 text-center">
                <Spin />
              </div>
            ) : !result ? (
              <Empty description="Nhập từ khoá để bắt đầu" />
            ) : result.items.length === 0 ? (
              <Empty description="Không có kết quả nào trong phạm vi bạn được phép đọc" />
            ) : (
              <List
                dataSource={result.items}
                renderItem={(hit) => (
                  <List.Item
                    key={hit.document_id}
                    className="cursor-pointer"
                    onClick={() => openPreview(hit)}
                  >
                    <List.Item.Meta
                      title={
                        <Space size={6} wrap>
                          <Tag color={KIND_COLOR[hit.kind]}>{KIND_LABEL[hit.kind]}</Tag>
                          <Text strong>{hit.title || hit.resource_id}</Text>
                          {hit.source_version && (
                            <Tooltip title="Phiên bản nguồn của kết quả này">
                              <Tag>v{hit.source_version}</Tag>
                            </Tooltip>
                          )}
                          {hit.locator && (
                            <Text type="secondary" className="text-xs">
                              {hit.locator}
                            </Text>
                          )}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={2} className="w-full">
                          <Paragraph className="mb-0">
                            <Highlighted text={hit.snippet} />
                          </Paragraph>
                          <Space size={4} wrap>
                            {Object.entries(hit.matched_by).map(([tool, detail]) => (
                              <Tooltip
                                key={tool}
                                title={`Hạng ${detail.rank} theo ${tool.toLowerCase()}`}
                              >
                                <Tag color={tool === "FULLTEXT" ? "cyan" : "magenta"}>
                                  {tool === "FULLTEXT" ? "đúng chữ" : "ngữ nghĩa"}
                                </Tag>
                              </Tooltip>
                            ))}
                            <Text type="secondary" className="text-xs">
                              lập chỉ mục {formatTime(hit.indexed_at)}
                            </Text>
                          </Space>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col span={7}>
          <Space direction="vertical" className="w-full" size="middle">
            {result && (
              <Card size="small" title="Phạm vi của bạn">
                <Paragraph type="secondary" className="text-xs">
                  Các con số dưới đây chỉ đếm phần bạn được phép đọc, nên chúng không
                  tiết lộ điều gì về tài liệu ngoài thẩm quyền.
                </Paragraph>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Tài liệu tìm được trong phạm vi">
                    {result.facets.visible_documents}
                  </Descriptions.Item>
                  {Object.entries(result.facets.kind).map(([kind, count]) => (
                    <Descriptions.Item key={kind} label={KIND_LABEL[kind as SearchKind]}>
                      {count}
                    </Descriptions.Item>
                  ))}
                  {Object.entries(result.facets.security_level).map(([level, count]) => (
                    <Descriptions.Item key={level} label={`Mức mật ${level}`}>
                      {count}
                    </Descriptions.Item>
                  ))}
                </Descriptions>
                {result.trimmed > 0 && (
                  <Text type="secondary" className="text-xs">
                    {result.trimmed} kết quả bị loại vì nguồn đã bị thu hồi.
                  </Text>
                )}
              </Card>
            )}

            <Card size="small" title={`Truy vấn đã lưu (${saved.length})`}>
              {saved.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Chưa lưu truy vấn nào"
                />
              ) : (
                <List
                  size="small"
                  dataSource={saved}
                  renderItem={(record) => (
                    <List.Item
                      actions={[
                        <Button
                          key="run"
                          size="small"
                          type="link"
                          onClick={() => runSaved(record)}
                        >
                          Chạy
                        </Button>,
                        <Button
                          key="del"
                          size="small"
                          type="link"
                          danger
                          onClick={async () => {
                            await searchApi.deleteSaved(record.id);
                            await loadSaved();
                          }}
                        >
                          Xoá
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={record.name}
                        description={
                          <Text type="secondary" className="text-xs">
                            {record.q} · đã chạy {record.run_count} lần
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </Space>
        </Col>
      </Row>

      <Drawer
        open={!!preview}
        width={760}
        title={preview?.title}
        onClose={() => setPreview(null)}
      >
        {preview && (
          <Space direction="vertical" className="w-full">
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="Loại">
                {KIND_LABEL[preview.kind]}
              </Descriptions.Item>
              <Descriptions.Item label="Phiên bản nguồn">
                {preview.source_version ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Vị trí">
                {preview.locator ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="Mức mật">
                {preview.security_level}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>Đoạn khớp</Title>
            <Paragraph>
              <Highlighted text={preview.highlights} />
            </Paragraph>

            <Title level={5}>Nội dung</Title>
            <Paragraph>
              <pre className="text-xs whitespace-pre-wrap">{preview.content}</pre>
              {preview.truncated && (
                <Text type="secondary" className="text-xs">
                  Đã cắt bớt phần còn lại.
                </Text>
              )}
            </Paragraph>
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
