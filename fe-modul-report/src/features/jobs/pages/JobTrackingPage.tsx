import { Card, Select, Button, Space, Statistic, Row, Col } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useJobs } from "../hooks/useJobs";
import JobTable from "../components/JobTable";
import { message } from "antd";
import type { JobStatusType } from "../types/job";

export default function JobTrackingPage() {
  const { jobs, total, loading, filters, setFilters, deleteJob, refresh } = useJobs();

  const handleDelete = async (jobId: string) => {
    const result = await deleteJob(jobId);
    if (result.success) {
      message.success("Đã xoá/huỷ job");
    } else {
      message.error(result.error);
    }
  };

  const runningCount = jobs.filter((j) => j.status === "running").length;
  const completedCount = jobs.filter((j) => j.status === "completed").length;
  const failedCount = jobs.filter((j) => j.status === "failed").length;

  return (
    <div className="space-y-4">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Đang chạy" value={runningCount} valueStyle={{ color: "#1677ff" }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Hoàn thành" value={completedCount} valueStyle={{ color: "#52c41a" }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="Thất bại" value={failedCount} valueStyle={{ color: "#ff4d4f" }} />
          </Card>
        </Col>
      </Row>

      <Card
        title={`Danh sách tác vụ (${total})`}
        extra={
          <Space>
            <Select
              placeholder="Trạng thái"
              allowClear
              value={filters.status}
              onChange={(val) => setFilters({ ...filters, status: val as JobStatusType })}
              options={[
                { value: "pending", label: "Chờ xử lý" },
                { value: "running", label: "Đang chạy" },
                { value: "completed", label: "Hoàn thành" },
                { value: "failed", label: "Thất bại" },
              ]}
              style={{ width: 140 }}
            />
            <Select
              placeholder="Loại job"
              allowClear
              value={filters.type}
              onChange={(val) => setFilters({ ...filters, type: val })}
              options={[
                { value: "import_live", label: "Import Live" },
                { value: "import_bak", label: "Import BAK" },
                { value: "upload_bak", label: "Upload BAK" },
                { value: "load_data", label: "Load Data" },
                { value: "insert_data", label: "Insert Data" },
                { value: "pipeline_upload", label: "Pipeline Upload" },
                { value: "sql_analyze", label: "SQL Analyze" },
              ]}
              style={{ width: 160 }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => refresh()} loading={loading}>
              Làm mới
            </Button>
          </Space>
        }
      >
        <JobTable jobs={jobs} loading={loading} onDelete={handleDelete} />
      </Card>
    </div>
  );
}
