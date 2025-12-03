import { Card, Row, Col, Statistic, Table } from "antd";
import {
  FileTextOutlined,
  UserOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import { Pie } from "@ant-design/charts";

const DashboardPage = () => {
  // Dữ liệu mẫu cho table
  const recentReports = [
    {
      key: "1",
      name: "Báo cáo bán hàng",
      type: "Word",
      department: "Kinh doanh",
      date: "2025-11-30",
    },
    {
      key: "2",
      name: "Báo cáo tồn kho",
      type: "Excel",
      department: "Kho",
      date: "2025-11-29",
    },
    {
      key: "3",
      name: "Báo cáo tài chính",
      type: "PDF",
      department: "Tài chính",
      date: "2025-11-28",
    },
  ];

  const columns = [
    { title: "Tên báo cáo", dataIndex: "name", key: "name" },
    { title: "Loại file", dataIndex: "type", key: "type" },
    { title: "Phòng ban", dataIndex: "department", key: "department" },
    { title: "Ngày tạo", dataIndex: "date", key: "date" },
  ];

  // Dữ liệu mẫu cho Pie Chart
  const pieData = [
    { type: "Báo cáo động", value: 60 },
    { type: "Báo cáo tĩnh", value: 30 },
    { type: "Báo cáo final", value: 10 },
  ];

  const pieConfig = {
    appendPadding: 10,
    data: pieData,
    angleField: "value",
    colorField: "type",
    radius: 0.8,
    label: {
      type: "outer",
      content: "{name} {percentage}",
    },
    interactions: [{ type: "element-active" }],
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Thống kê */}
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng báo cáo"
              value={1128}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Phòng ban"
              value={12}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Người dùng"
              value={58}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Biểu đồ tròn */}
      <Card title="Tỷ lệ các loại báo cáo" className="mb-6">
        <div style={{ height: 300 }}>
          <Pie {...pieConfig} />
        </div>
      </Card>

      {/* Báo cáo gần đây */}
      <Card title="Báo cáo gần đây">
        <Table
          columns={columns}
          dataSource={recentReports}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default DashboardPage;
