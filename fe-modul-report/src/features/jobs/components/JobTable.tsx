import { Table, Button, Popconfirm, Typography, Tooltip } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { JobStatus } from "../types/job";
import JobStatusBadge from "./JobStatusBadge";
import JobProgressBar from "./JobProgressBar";

const { Text } = Typography;

interface Props {
  jobs: JobStatus[];
  loading: boolean;
  onDelete: (jobId: string) => void;
}

export default function JobTable({ jobs, loading, onDelete }: Props) {
  const columns = [
    {
      title: "Job ID",
      dataIndex: "job_id",
      key: "job_id",
      width: 120,
      render: (id: string) => (
        <Tooltip title={id}>
          <Text copyable={{ text: id }} className="font-mono text-xs">
            {id.substring(0, 8)}...
          </Text>
        </Tooltip>
      ),
    },
    {
      title: "Loại",
      dataIndex: "job_type",
      key: "job_type",
      width: 130,
      render: (type: string) => <Text className="font-medium">{type}</Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: JobStatus["status"]) => <JobStatusBadge status={status} />,
    },
    {
      title: "Tiến độ",
      key: "progress",
      width: 200,
      render: (_: unknown, record: JobStatus) => <JobProgressBar job={record} />,
    },
    {
      title: "Lỗi",
      key: "errors",
      width: 80,
      render: (_: unknown, record: JobStatus) => {
        const count = record.errors.length;
        return count > 0 ? <Text type="danger">{count} lỗi</Text> : <Text type="secondary">0</Text>;
      },
    },
    {
      title: "Tạo lúc",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (date: string) => new Date(date).toLocaleString("vi-VN"),
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_: unknown, record: JobStatus) => (
        <Popconfirm
          title={record.status === "running" ? "Huỷ job này?" : "Xoá job này?"}
          onConfirm={() => onDelete(record.job_id)}
          okText="OK"
          cancelText="Huỷ"
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={jobs}
      rowKey="job_id"
      loading={loading}
      pagination={false}
      size="middle"
      scroll={{ x: 900 }}
    />
  );
}
