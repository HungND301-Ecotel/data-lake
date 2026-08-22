import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { CloudUploadOutlined, ReloadOutlined } from "@ant-design/icons";
import ingestionApi from "../api/ingestionApi";
import { useIngestionRefData } from "../hooks/useIngestionRefData";
import IngestUploadModal from "../components/IngestUploadModal";
import ObjectDetailDrawer from "../components/ObjectDetailDrawer";
import {
  ObjectStatusTag,
  SecurityLabelTag,
  formatBytes,
  formatTime,
} from "../components/statusTags";
import type { BronzeObject, ObjectStatus } from "../types/ingestion";

const { Text } = Typography;

const STATUS_OPTIONS: ObjectStatus[] = [
  "UPLOADED",
  "QUARANTINED",
  "ACCEPTED",
  "PROCESSING",
  "PROCESSED",
  "REJECTED",
  "ARCHIVED",
];

/** How often the list refreshes while a job is still running. */
const POLL_MS = 5000;

export default function IngestionPage() {
  const { labels } = useIngestionRefData();
  const [objects, setObjects] = useState<BronzeObject[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [status, setStatus] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ingestionApi.listObjects({
        status,
        q: search || undefined,
        page,
        size,
      });
      setObjects(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [status, search, page, size]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the table live while anything is still moving through the pipeline.
  useEffect(() => {
    const pending = objects.some((o) =>
      ["UPLOADED", "QUARANTINED", "ACCEPTED", "PROCESSING"].includes(o.status)
    );
    if (!pending) return;
    const timer = setInterval(load, POLL_MS);
    return () => clearInterval(timer);
  }, [objects, load]);

  return (
    <div className="space-y-4">
      <Card
        title="Tiếp nhận dữ liệu (Bronze)"
        extra={
          <Space>
            <Input.Search
              allowClear
              placeholder="Tìm theo tên tệp"
              onSearch={(value) => {
                setPage(1);
                setSearch(value);
              }}
              style={{ width: 240 }}
            />
            <Select
              allowClear
              placeholder="Trạng thái"
              style={{ width: 160 }}
              value={status}
              onChange={(value) => {
                setPage(1);
                setStatus(value);
              }}
              options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
            />
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={() => setUploadOpen(true)}
            >
              Tải lên
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="object_id"
          loading={loading}
          dataSource={objects}
          onRow={(row) => ({ onClick: () => setSelectedId(row.object_id) })}
          rowClassName="cursor-pointer"
          pagination={{
            current: page,
            pageSize: size,
            total,
            showSizeChanger: true,
            onChange: (nextPage, nextSize) => {
              setPage(nextPage);
              setSize(nextSize);
            },
          }}
          columns={[
            {
              title: "Tệp",
              dataIndex: "original_name",
              render: (value: string, row) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{value}</Text>
                  <Text type="secondary" className="text-xs">
                    {row.mime_detected} · {formatBytes(row.size_bytes)}
                  </Text>
                </Space>
              ),
            },
            {
              title: "Trạng thái",
              dataIndex: "status",
              width: 150,
              render: (value: ObjectStatus) => <ObjectStatusTag status={value} />,
            },
            {
              title: "Nhãn bảo mật",
              dataIndex: "security_label_id",
              width: 160,
              render: (value: string) => (
                <SecurityLabelTag label={labels.find((l) => l.id === value)} />
              ),
            },
            {
              title: "Loại tài liệu",
              dataIndex: "document_type",
              width: 160,
            },
            {
              title: "Phiên bản",
              dataIndex: "current_version_no",
              width: 100,
              render: (value: number) => <Tag>v{value}</Tag>,
            },
            {
              title: "SHA-256",
              dataIndex: "sha256",
              width: 140,
              render: (value: string) => (
                <Text code className="text-xs">
                  {value.slice(0, 12)}…
                </Text>
              ),
            },
            {
              title: "Tiếp nhận lúc",
              dataIndex: "created_at",
              width: 170,
              render: (value: string) => formatTime(value),
            },
          ]}
        />
      </Card>

      <IngestUploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={(object) => {
          message.success(
            object.status === "ACCEPTED"
              ? "Đã tiếp nhận, job xử lý đang chạy nền"
              : `Trạng thái: ${object.status}`
          );
          load();
        }}
      />

      <ObjectDetailDrawer
        objectId={selectedId}
        labels={labels}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
