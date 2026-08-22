import { useCallback, useEffect, useState } from "react";
import { Button, Card, DatePicker, Input, Select, Space, Table, Tag, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import ingestionApi from "../api/ingestionApi";
import { formatTime } from "../components/statusTags";
import type { AuditEvent } from "../types/ingestion";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const RESULT_COLOR: Record<string, string> = {
  SUCCESS: "green",
  DENIED: "red",
  FAILURE: "orange",
};

/**
 * Read-only audit search (doc M14 UC14.04). The trail is append-only on the
 * worker side; nothing here can modify it.
 */
export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<{
    actor?: string;
    action?: string;
    result?: string;
    correlation_id?: string;
    from?: string;
    to?: string;
  }>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await ingestionApi.searchAudit({ ...filters, page, size: 50 });
      setEvents(result.items);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (patch: Partial<typeof filters>) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  return (
    <Card
      title="Nhật ký kiểm toán"
      extra={
        <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
          Làm mới
        </Button>
      }
    >
      <Space wrap className="mb-4">
        <Input
          allowClear
          placeholder="Người thực hiện"
          style={{ width: 180 }}
          onChange={(e) => update({ actor: e.target.value || undefined })}
        />
        <Input
          allowClear
          placeholder="Hành động"
          style={{ width: 200 }}
          onChange={(e) => update({ action: e.target.value || undefined })}
        />
        <Input
          allowClear
          placeholder="Correlation ID"
          style={{ width: 220 }}
          onChange={(e) => update({ correlation_id: e.target.value || undefined })}
        />
        <Select
          allowClear
          placeholder="Kết quả"
          style={{ width: 140 }}
          onChange={(value) => update({ result: value })}
          options={["SUCCESS", "DENIED", "FAILURE"].map((v) => ({ value: v, label: v }))}
        />
        <RangePicker
          showTime
          onChange={(range) =>
            update({
              from: range?.[0]?.toISOString(),
              to: range?.[1]?.toISOString(),
            })
          }
        />
      </Space>

      <Table
        rowKey="audit_id"
        loading={loading}
        dataSource={events}
        size="small"
        pagination={{ current: page, pageSize: 50, total, onChange: setPage }}
        columns={[
          {
            title: "Thời điểm",
            dataIndex: "occurred_at",
            width: 180,
            render: (value: string) => formatTime(value),
          },
          { title: "Người thực hiện", dataIndex: "actor", width: 150 },
          { title: "Hành động", dataIndex: "action", width: 200 },
          {
            title: "Tài nguyên",
            key: "resource",
            render: (_, row) => (
              <Text className="text-xs">
                {row.resource_type}
                {row.resource_id ? ` · ${row.resource_id.slice(0, 8)}…` : ""}
              </Text>
            ),
          },
          {
            title: "Kết quả",
            dataIndex: "result",
            width: 110,
            render: (value: string) => <Tag color={RESULT_COLOR[value]}>{value}</Tag>,
          },
          { title: "Quyết định policy", dataIndex: "policy_decision", width: 170 },
          {
            title: "Correlation",
            dataIndex: "correlation_id",
            width: 130,
            render: (value: string) =>
              value ? (
                <Text code className="text-xs">
                  {value.slice(0, 10)}…
                </Text>
              ) : (
                "—"
              ),
          },
          { title: "Chi tiết", dataIndex: "details", ellipsis: true },
        ]}
      />
    </Card>
  );
}
