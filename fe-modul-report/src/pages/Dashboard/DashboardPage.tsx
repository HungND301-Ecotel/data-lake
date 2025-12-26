import { Card, Row, Col, Statistic, Table } from "antd";
import { FileTextOutlined, UserOutlined, DatabaseOutlined } from "@ant-design/icons";
import { Column, Line } from "@ant-design/charts";

const DashboardPage = () => {
  // Dữ liệu table
  const recentReports = [
    { key: "1", name: "Báo cáo bán hàng", type: "Word", department: "Kinh doanh", date: "2025-11-30" },
    { key: "2", name: "Báo cáo tồn kho", type: "Excel", department: "Kho", date: "2025-11-29" },
    { key: "3", name: "Báo cáo tài chính", type: "PDF", department: "Tài chính", date: "2025-11-28" },
  ];

  const columns = [
    { title: "Tên báo cáo", dataIndex: "name", key: "name" },
    { title: "Loại file", dataIndex: "type", key: "type" },
    { title: "Phòng ban", dataIndex: "department", key: "department" },
    { title: "Ngày tạo", dataIndex: "date", key: "date" },
  ];

  const barData = [
    { department: "Kinh doanh", reports: 40 },
    { department: "Kho", reports: 30 },
    { department: "Tài chính", reports: 50 },
    { department: "Marketing", reports: 25 },
  ];

  const barConfig = {
    data: barData,
    xField: "department",
    yField: "reports",
    label: { position: "middle" },
    tooltip: { showMarkers: false },
    meta: { department: { alias: "Phòng ban" }, reports: { alias: "Số báo cáo" } },
  };

  const lineData = [
    { date: "2025-11-25", reports: 5 },
    { date: "2025-11-26", reports: 8 },
    { date: "2025-11-27", reports: 6 },
    { date: "2025-11-28", reports: 10 },
    { date: "2025-11-29", reports: 7 },
    { date: "2025-11-30", reports: 12 },
  ];

  const lineConfig = {
    data: lineData,
    xField: "date",
    yField: "reports",
    point: { size: 5, shape: "diamond" },
    label: { style: { fill: "#aaa" } },
    smooth: true,
  };

  return (
    <div className=" min-h-screen">
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <Statistic title="Tổng báo cáo" value={1128} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Phòng ban" value={12} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Người dùng" value={58} prefix={<UserOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col span={12}>
          <Card title="Số báo cáo theo phòng ban">
            <div style={{ height: 250 }}>
              <Column {...barConfig} />
            </div>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Xu hướng báo cáo theo ngày">
            <div style={{ height: 250 }}>
              <Line {...lineConfig} />
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Báo cáo gần đây">
        <Table columns={columns} dataSource={recentReports} pagination={false} />
      </Card>
    </div>
  );
};

export default DashboardPage;
