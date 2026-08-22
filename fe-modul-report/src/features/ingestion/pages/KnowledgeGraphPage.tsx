import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Input,
  List,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import graphApi, {
  type GraphEntity,
  type GraphNeighbour,
  type GraphQueryResult,
  type GraphRelationship,
  type MergeProposal,
  type OntologyPredicate,
} from "../api/graphApi";
import { formatTime } from "../components/statusTags";
import { useHasPermission } from "../../../stores/authStore";

const { Text, Paragraph } = Typography;

const STATUS_COLOR: Record<string, string> = {
  CANDIDATE: "orange",
  PENDING_REVIEW: "gold",
  APPROVED: "green",
  REJECTED: "red",
};

export default function KnowledgeGraphPage() {
  const canReview = useHasPermission("catalog.manage");

  const [predicates, setPredicates] = useState<OntologyPredicate[]>([]);
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<GraphRelationship[]>([]);
  const [approved, setApproved] = useState<GraphRelationship[]>([]);
  const [merges, setMerges] = useState<MergeProposal[]>([]);
  const [entities, setEntities] = useState<GraphEntity[]>([]);
  const [detail, setDetail] = useState<
    (GraphEntity & { neighbours: GraphNeighbour[] }) | null
  >(null);
  const [walk, setWalk] = useState<GraphQueryResult | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogue, pending, live, proposals, list] = await Promise.all([
        graphApi.ontology(),
        graphApi.relationships("CANDIDATE", 100),
        graphApi.relationships("APPROVED", 100),
        graphApi.merges(),
        graphApi.entities(undefined, 50),
      ]);
      setPredicates(catalogue.predicates);
      setEntityTypes(catalogue.entities.map((e) => e.code));
      setCandidates(pending.items);
      setApproved(live.items);
      setMerges(proposals.items);
      setEntities(list.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sensitiveCodes = new Set(
    predicates.filter((p) => p.sensitive).map((p) => p.code)
  );

  const review = (relationship: GraphRelationship, approve: boolean) => {
    let note = "";
    const needsNote = approve && sensitiveCodes.has(relationship.predicate);
    Modal.confirm({
      title: approve
        ? `Duyệt quan hệ ${relationship.predicate}?`
        : `Từ chối quan hệ ${relationship.predicate}?`,
      width: 560,
      content: (
        <Space direction="vertical" className="w-full">
          <Text type="secondary">
            Nguồn: {relationship.source_location} · extractor{" "}
            {relationship.extractor_version} · độ tin cậy {relationship.confidence}
          </Text>
          {needsNote && (
            <Alert
              type="warning"
              showIcon
              message="Quan hệ này ảnh hưởng tới số liệu báo cáo nên phê duyệt phải kèm ghi chú."
            />
          )}
          <Input.TextArea
            rows={3}
            placeholder={needsNote ? "Đã đối chiếu với gì?" : "Ghi chú (tuỳ chọn)"}
            onChange={(e) => (note = e.target.value)}
          />
        </Space>
      ),
      okText: approve ? "Duyệt" : "Từ chối",
      okButtonProps: { danger: !approve },
      cancelText: "Huỷ",
      onOk: async () => {
        try {
          await graphApi.review(relationship.id, approve, note);
          message.success(approve ? "Đã duyệt" : "Đã từ chối");
          await load();
        } catch (error) {
          message.error(readError(error, "Không ghi được quyết định"));
          throw error;
        }
      },
    });
  };

  const runQuery = async () => {
    if (!query.trim()) return;
    setWalk(await graphApi.query({ q: query, max_hops: 3 }));
  };

  const relationshipColumns = (pending: boolean) => [
    {
      title: "Quan hệ",
      key: "triple",
      render: (_: unknown, row: GraphRelationship) => (
        <Space size={4} wrap>
          <Tag>{row.predicate}</Tag>
          {sensitiveCodes.has(row.predicate) && (
            <Tooltip title="Quan hệ nhạy cảm: phê duyệt phải kèm ghi chú">
              <Tag color="red">nhạy cảm</Tag>
            </Tooltip>
          )}
          <Text type="secondary" className="text-xs">
            tin cậy {row.confidence}
          </Text>
        </Space>
      ),
    },
    {
      title: "Nguồn gốc",
      key: "provenance",
      render: (_: unknown, row: GraphRelationship) => (
        <Space direction="vertical" size={0}>
          <Text className="text-xs">{row.source_location}</Text>
          <Text type="secondary" className="text-xs">
            extractor {row.extractor_version} · {formatTime(row.created_at)}
          </Text>
        </Space>
      ),
    },
    { title: "Mức mật", dataIndex: "security_level", width: 90 },
    {
      title: "Trạng thái",
      dataIndex: "review_status",
      width: 200,
      render: (status: string, row: GraphRelationship) => (
        <Space direction="vertical" size={0}>
          <Tag color={STATUS_COLOR[status]}>{status}</Tag>
          {row.reviewed_by && (
            <Text type="secondary" className="text-xs">
              {row.reviewed_by} · {formatTime(row.reviewed_at)}
            </Text>
          )}
        </Space>
      ),
    },
    ...(pending && canReview
      ? [
          {
            title: "",
            key: "actions",
            width: 170,
            render: (_: unknown, row: GraphRelationship) => (
              <Space>
                <Button size="small" type="primary" onClick={() => review(row, true)}>
                  Duyệt
                </Button>
                <Button size="small" danger onClick={() => review(row, false)}>
                  Từ chối
                </Button>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <Card
        title="Đồ thị tri thức"
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
          message="Đồ thị chỉ nhận node/edge đã ánh xạ vào ontology, và mọi quan hệ đều phải nêu được nguồn gốc."
          description="Quan hệ mới luôn ở trạng thái chờ duyệt; chỉ quan hệ đã duyệt mới đi vào câu trả lời của trợ lý AI. Tên gần giống nhau không bao giờ tự hợp nhất — hệ thống chỉ đề xuất, người quyết định."
        />

        <Tabs
          items={[
            {
              key: "candidates",
              label: `Chờ duyệt (${candidates.length})`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  loading={loading}
                  dataSource={candidates}
                  locale={{ emptyText: <Empty description="Không có quan hệ nào chờ duyệt" /> }}
                  columns={relationshipColumns(true)}
                />
              ),
            },
            {
              key: "approved",
              label: `Đã duyệt (${approved.length})`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  dataSource={approved}
                  locale={{ emptyText: <Empty description="Chưa duyệt quan hệ nào" /> }}
                  columns={relationshipColumns(false)}
                />
              ),
            },
            {
              key: "merges",
              label: `Đề xuất hợp nhất (${merges.length})`,
              children: (
                <List
                  dataSource={merges}
                  locale={{ emptyText: <Empty description="Không có đề xuất nào" /> }}
                  renderItem={(proposal) => (
                    <List.Item
                      actions={
                        canReview
                          ? [
                              <Button
                                key="yes"
                                size="small"
                                type="link"
                                onClick={async () => {
                                  await graphApi.reviewMerge(proposal.id, true);
                                  message.success("Đã hợp nhất");
                                  await load();
                                }}
                              >
                                Là một
                              </Button>,
                              <Button
                                key="no"
                                size="small"
                                type="link"
                                danger
                                onClick={async () => {
                                  await graphApi.reviewMerge(proposal.id, false);
                                  await load();
                                }}
                              >
                                Khác nhau
                              </Button>,
                            ]
                          : []
                      }
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text strong>{proposal.source?.name}</Text>
                            <Text type="secondary">≟</Text>
                            <Text strong>{proposal.target?.name}</Text>
                            <Tag color="gold">
                              tin cậy {(proposal.confidence * 100).toFixed(0)}%
                            </Tag>
                          </Space>
                        }
                        description={
                          <Text type="secondary" className="text-xs">
                            {proposal.rationale}
                          </Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: "explore",
              label: "Đi theo quan hệ",
              children: (
                <Space direction="vertical" className="w-full">
                  <Space.Compact className="w-full">
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onPressEnter={runQuery}
                      placeholder="Tên đơn vị, số hiệu văn bản…"
                      prefix={<SearchOutlined />}
                    />
                    <Button type="primary" onClick={runQuery}>
                      Đi
                    </Button>
                  </Space.Compact>

                  {walk?.note && <Alert type="warning" showIcon message={walk.note} />}

                  {walk && walk.paths.length > 0 && (
                    <>
                      <Text type="secondary" className="text-xs">
                        Xuất phát từ{" "}
                        {walk.seeds.map((s) => (
                          <Tag key={s.id}>{s.name}</Tag>
                        ))}
                        · thăm {walk.visited} thực thể
                      </Text>
                      <List
                        dataSource={walk.paths}
                        renderItem={(path) => (
                          <List.Item>
                            <Space direction="vertical" size={2} className="w-full">
                              <Space size={4} wrap>
                                {path.path.map((step, index) => (
                                  <span key={index}>
                                    <Text>{step.subject}</Text>{" "}
                                    <Tag color="blue">{step.predicate}</Tag>{" "}
                                    <Text>{step.object}</Text>
                                    {index < path.path.length - 1 && (
                                      <Text type="secondary"> → </Text>
                                    )}
                                  </span>
                                ))}
                              </Space>
                              <Text type="secondary" className="text-xs">
                                {path.path
                                  .map(
                                    (s) =>
                                      `${s.source_location} · duyệt bởi ${s.reviewed_by}`
                                  )
                                  .join(" | ")}
                              </Text>
                            </Space>
                          </List.Item>
                        )}
                      />
                    </>
                  )}
                </Space>
              ),
            },
            {
              key: "entities",
              label: `Thực thể (${entities.length})`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  dataSource={entities}
                  onRow={(row) => ({
                    onClick: async () => setDetail(await graphApi.entity(row.id)),
                  })}
                  rowClassName="cursor-pointer"
                  columns={[
                    { title: "Tên", dataIndex: "name" },
                    { title: "Loại", dataIndex: "type", width: 150 },
                    {
                      title: "Bí danh",
                      dataIndex: "aliases",
                      render: (aliases: string[]) => (
                        <Text type="secondary" className="text-xs">
                          {aliases.join(", ")}
                        </Text>
                      ),
                    },
                    { title: "Mức mật", dataIndex: "security_level", width: 90 },
                    {
                      title: "Cách hợp nhất",
                      dataIndex: "resolution_method",
                      width: 150,
                      render: (method: string) => (
                        <Tooltip
                          title={
                            method === "DETERMINISTIC"
                              ? "Trùng khoá xác định"
                              : "Do người quyết định"
                          }
                        >
                          <Tag>{method}</Tag>
                        </Tooltip>
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: "ontology",
              label: `Ontology (${entityTypes.length + predicates.length})`,
              children: (
                <Space direction="vertical" className="w-full">
                  <Paragraph type="secondary">
                    Extractor không tự đặt được nhãn mới: node hoặc edge mang loại chưa
                    khai báo ở đây sẽ bị từ chối ngay tại adapter.
                  </Paragraph>
                  <Card size="small" title="Loại thực thể">
                    <Space wrap>
                      {entityTypes.map((code) => (
                        <Tag key={code}>{code}</Tag>
                      ))}
                    </Space>
                  </Card>
                  <Table
                    rowKey="code"
                    size="small"
                    pagination={false}
                    dataSource={predicates}
                    columns={[
                      { title: "Predicate", dataIndex: "code", width: 200 },
                      { title: "Ý nghĩa", dataIndex: "name" },
                      {
                        title: "Chủ thể cho phép",
                        dataIndex: "subject_types",
                        render: (types: string[]) =>
                          types.length ? types.join(", ") : "mọi loại",
                      },
                      {
                        title: "Đối tượng cho phép",
                        dataIndex: "object_types",
                        render: (types: string[]) =>
                          types.length ? types.join(", ") : "mọi loại",
                      },
                      {
                        title: "",
                        dataIndex: "sensitive",
                        width: 110,
                        render: (sensitive: boolean) =>
                          sensitive ? <Tag color="red">nhạy cảm</Tag> : null,
                      },
                    ]}
                  />
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Drawer
        open={!!detail}
        width={760}
        title={detail?.name}
        onClose={() => setDetail(null)}
      >
        {detail && (
          <Space direction="vertical" className="w-full">
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label="Loại">{detail.type}</Descriptions.Item>
              <Descriptions.Item label="Mức mật">
                {detail.security_level}
              </Descriptions.Item>
              <Descriptions.Item label="Khoá xác định" span={2}>
                <Text code>{detail.canonical_key}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Bí danh" span={2}>
                {detail.aliases.join(", ") || "—"}
              </Descriptions.Item>
            </Descriptions>

            <Table
              rowKey={(row) => row.relationship.id}
              size="small"
              dataSource={detail.neighbours}
              locale={{
                emptyText: (
                  <Empty description="Chưa có quan hệ đã duyệt nào trong phạm vi bạn được đọc" />
                ),
              }}
              columns={[
                {
                  title: "Chiều",
                  dataIndex: "direction",
                  width: 80,
                  render: (direction: string) => (
                    <Tag>{direction === "OUT" ? "→" : "←"}</Tag>
                  ),
                },
                {
                  title: "Quan hệ",
                  key: "predicate",
                  render: (_, row) => <Tag color="blue">{row.relationship.predicate}</Tag>,
                },
                {
                  title: "Thực thể",
                  key: "entity",
                  render: (_, row) => row.entity.name,
                },
                {
                  title: "Nguồn",
                  key: "source",
                  render: (_, row) => (
                    <Text type="secondary" className="text-xs">
                      {row.relationship.source_location}
                    </Text>
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
