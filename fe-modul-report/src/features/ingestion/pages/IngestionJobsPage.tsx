import { useCallback, useEffect, useState } from "react";
import { Button, Card, Popconfirm, Select, Space, Table, Tabs, Typography, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import ingestionApi from "../api/ingestionApi";
import { JobStatusTag, formatTime } from "../components/statusTags";
import type { DlqItem, JobStatus, ProcessingJob } from "../types/ingestion";

const { Text } = Typography;

const STATUS_OPTIONS: JobStatus[] = [
  "PENDING",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "DEAD",
];

export default function IngestionJobsPage() {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [dlq, setDlq] = useState<DlqItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [jobPage, dlqPage] = await Promise.all([
        ingestionApi.listJobs({ status, page, size: 20 }),
        ingestionApi.listDlq(),
      ]);
      setJobs(jobPage.items);
      setTotal(jobPage.total);
      setDlq(dlqPage.items);
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh while work is in flight so the operator sees progress.
  useEffect(() => {
    const active = jobs.some((j) => ["PENDING", "RUNNING", "FAILED"].includes(j.status));
    if (!active) return;
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [jobs, load]);

  return (
    <Card
      title="Job xử lý và DLQ"
      extra={
        <Space>
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
        </Space>
      }
    >
      <Tabs
        items={[
          {
            key: "jobs",
            label: `Job (${total})`,
            children: (
              <Table
                rowKey="job_id"
                loading={loading}
                dataSource={jobs}
                pagination={{
                  current: page,
                  pageSize: 20,
                  total,
                  onChange: setPage,
                }}
                columns={[
                  { title: "Loại", dataIndex: "job_type", width: 170 },
                  {
                    title: "Trạng thái",
                    dataIndex: "status",
                    width: 150,
                    render: (value: JobStatus) => <JobStatusTag status={value} />,
                  },
                  {
                    title: "Lần thử",
                    key: "attempt",
                    width: 90,
                    render: (_, row) => `${row.attempt}/${row.max_attempts}`,
                  },
                  {
                    title: "Đối tượng",
                    dataIndex: "object_id",
                    render: (value: string) => (
                      <Text code className="text-xs">
                        {value.slice(0, 8)}…
                      </Text>
                    ),
                  },
                  { title: "Lỗi", dataIndex: "error_message", ellipsis: true },
                  {
                    title: "Bắt đầu",
                    dataIndex: "started_at",
                    width: 170,
                    render: (value: string) => formatTime(value),
                  },
                  {
                    title: "",
                    key: "action",
                    width: 100,
                    render: (_, row) =>
                      ["PENDING", "RUNNING", "FAILED"].includes(row.status) ? (
                        <Popconfirm
                          title="Huỷ job này?"
                          onConfirm={async () => {
                            await ingestionApi.cancelJob(row.job_id);
                            message.success("Đã huỷ job");
                            load();
                          }}
                        >
                          <Button size="small" danger>
                            Huỷ
                          </Button>
                        </Popconfirm>
                      ) : null,
                  },
                ]}
              />
            ),
          },
          {
            key: "dlq",
            label: `DLQ (${dlq.length})`,
            children: (
              <Table
                rowKey="dlq_id"
                loading={loading}
                dataSource={dlq}
                pagination={false}
                columns={[
                  {
                    title: "Đối tượng",
                    dataIndex: "object_id",
                    render: (value: string) => (
                      <Text code className="text-xs">
                        {value.slice(0, 8)}…
                      </Text>
                    ),
                  },
                  { title: "Lý do", dataIndex: "reason", ellipsis: true },
                  {
                    title: "Vào DLQ lúc",
                    dataIndex: "created_at",
                    width: 170,
                    render: (value: string) => formatTime(value),
                  },
                  {
                    title: "Đã replay",
                    dataIndex: "replayed_at",
                    width: 170,
                    render: (value: string) => formatTime(value),
                  },
                  {
                    title: "",
                    key: "action",
                    width: 110,
                    render: (_, row) =>
                      row.replayed_at ? null : (
                        <Button
                          size="small"
                          onClick={async () => {
                            await ingestionApi.replayDlq(row.dlq_id);
                            message.success("Đã đưa lại vào hàng đợi");
                            load();
                          }}
                        >
                          Replay
                        </Button>
                      ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </Card>
  );
}
