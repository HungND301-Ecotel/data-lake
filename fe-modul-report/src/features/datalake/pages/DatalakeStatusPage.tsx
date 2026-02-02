import { Row, Col, Card, List, Tag, Typography } from "antd";
import {
  DatabaseOutlined,
  FileExcelOutlined,
  SyncOutlined,
  MessageOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { Column, Line, Pie } from "@ant-design/charts";
import { useDataStatus } from "../hooks/useDataStatus";
import { useSyncStatus } from "../../datalake-sync/hooks/useSyncStatus";
import { useHealthCheck } from "../hooks/useHealthCheck";
import StatsCard from "../components/StatsCard";
import SystemStatusCard from "../components/SystemStatusCard";

const { Text } = Typography;

const DatalakeStatusPage: React.FC = () => {
  const { status: dataStatus } = useDataStatus();
  const { status: syncStatus } = useSyncStatus();
  const { healthStatus, readyStatus, loading: healthLoading } = useHealthCheck();

  // Sample chart data
  const revenueData = [
    { month: "T1", value: 120 },
    { month: "T2", value: 150 },
    { month: "T3", value: 180 },
    { month: "T4", value: 140 },
    { month: "T5", value: 200 },
    { month: "T6", value: 220 },
  ];

  const trendData = [
    { week: "Tuần 1", value: 30 },
    { week: "Tuần 2", value: 45 },
    { week: "Tuần 3", value: 38 },
    { week: "Tuần 4", value: 52 },
  ];

  const pieData = [
    { type: "Excel", value: 40 },
    { type: "SQL Backup", value: 25 },
    { type: "Live DB", value: 20 },
    { type: "Khác", value: 15 },
  ];

  const recentActivity = [
    { action: "Đồng bộ dữ liệu hoàn tất", time: "2 phút trước", type: "success" },
    { action: "File Excel mới được tải lên", time: "15 phút trước", type: "info" },
    { action: "Truy vấn chat: 'Doanh thu Q1'", time: "32 phút trước", type: "default" },
    { action: "Reindex hoàn tất", time: "1 giờ trước", type: "success" },
    { action: "Phiên chat mới", time: "2 giờ trước", type: "info" },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Tổng tài liệu"
            value={dataStatus?.document_count?.toLocaleString() || "0"}
            change="+12% so với tuần trước"
            changeType="positive"
            icon={<DatabaseOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Nguồn dữ liệu"
            value={
              (dataStatus?.excel_files_count || 0) +
              (dataStatus?.bak_files_count || 0)
            }
            change="2 mới trong tháng"
            changeType="positive"
            icon={<FileExcelOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Đồng bộ"
            value={syncStatus?.is_running ? "Đang chạy" : "Đã dừng"}
            change={
              syncStatus?.is_running
                ? `Mỗi ${syncStatus.interval_minutes} phút`
                : "Nhấn để bắt đầu"
            }
            changeType={syncStatus?.is_running ? "positive" : "neutral"}
            icon={<SyncOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard
            title="Phiên chat"
            value="24"
            change="+5 hôm nay"
            changeType="positive"
            icon={<MessageOutlined />}
          />
        </Col>
      </Row>

      {/* System Status */}
      <SystemStatusCard
        healthStatus={healthStatus}
        readyStatus={readyStatus}
        loading={healthLoading}
      />

      {/* Charts Grid */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Tổng quan doanh thu" size="small">
            <Column
              data={revenueData}
              xField="month"
              yField="value"
              height={280}
              color="#1677ff"
              label={{ position: "middle" as const }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Xu hướng truy vấn" size="small">
            <Line
              data={trendData}
              xField="week"
              yField="value"
              height={280}
              color="#1677ff"
              point={{ size: 4, shape: "circle" }}
              smooth
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="Phân bố nguồn dữ liệu" size="small">
            <Pie
              data={pieData}
              angleField="value"
              colorField="type"
              height={280}
              innerRadius={0.4}
              label={{ type: "outer" }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="Hoạt động gần đây" size="small">
            <List
              dataSource={recentActivity}
              renderItem={(item) => (
                <List.Item
                  extra={
                    <Tag
                      color={
                        item.type === "success"
                          ? "success"
                          : item.type === "info"
                            ? "processing"
                            : "default"
                      }
                    >
                      {item.type === "success"
                        ? "Xong"
                        : item.type === "info"
                          ? "Mới"
                          : "Truy vấn"}
                    </Tag>
                  }
                >
                  <List.Item.Meta
                    avatar={<ClockCircleOutlined />}
                    title={<Text className="text-sm">{item.action}</Text>}
                    description={
                      <Text type="secondary" className="text-xs">
                        {item.time}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DatalakeStatusPage;
