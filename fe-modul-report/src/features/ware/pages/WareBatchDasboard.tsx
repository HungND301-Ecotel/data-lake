import { Card, Row, Col, Statistic, Table, Tag, Select } from "antd";
import { DatabaseOutlined, EditOutlined } from "@ant-design/icons";
import { Column, Line } from "@ant-design/charts";
import { useEffect, useState } from "react";
import type {
  TimeCountDto,
  WareBatchActionResponse,
  WareBatchActionSearch,
  WareBatchActionStatistic,
} from "../types/wareBatchAction";
import { wareBatchActionApi } from "../api/wareBatchActionApi";

const DashboardWare = () => {
  const [dashboard, setDashboard] = useState<WareBatchActionStatistic>({
    insert_today: 0,
    update_today: 0,
    insert_total: 0,
    update_total: 0,
  });
  const formatVNDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };
  const [lineChartData, setLineChartData] = useState<TimeCountDto[]>([]);
  const [lineType, setLineType] = useState<"DAY" | "MONTH" | "YEAR">("DAY");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [chartColumData, setChartColumData] = useState<TimeCountDto[]>([]);
  const fetchChartLineData = async (type: "DAY" | "MONTH" | "YEAR") => {
    try {
      const res = await wareBatchActionApi.cntActionTime(type);
      setLineChartData(res);
    } catch (err) {
      console.error("Fetch line chart data failed", err);
    }
  };

  const getTop10Table = async () => {
    try {
      const res = await wareBatchActionApi.getTop10ByMonth();
      setChartColumData(res);
    } catch (err) {
      console.error("Fetch colums chart data failed", err);
    }
  };

  const [actions, setActions] = useState<WareBatchActionResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await wareBatchActionApi.getDashboard();
      setDashboard(res);
    } catch (err) {
      console.error("Fetch dashboard failed", err);
    }
  };

  const fetchAuditActions = async (p = page, s = pageSize) => {
    try {
      setLoading(true);

      const req: WareBatchActionSearch = {
        page: p,
        limit: s,
        actionName: "",
        tableName: "",
        sortBy: "createdAt",
        sort: "DESC",
      };

      const res = await wareBatchActionApi.searchWareActionBatch(req);

      setActions(res.content);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Fetch audit actions failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditActions(page, pageSize);
  }, [page, pageSize]);

  useEffect(() => {
    fetchDashboard();
    fetchAuditActions();
    getTop10Table();
  }, []);

  useEffect(() => {
    fetchChartLineData(lineType);
  }, [lineType]);

  const columns = [
    {
      title: "Request ID",
      dataIndex: "requestId",
    },

    {
      title: "Table",
      dataIndex: "tableName",
    },
    // {
    //   title: "BUKRS",
    //   dataIndex: "burks",
    // },
    {
      title: "Action",
      dataIndex: "actionName",
      render: (value: string) =>
        value === "Insert" ? (
          <Tag color="green">INSERT</Tag>
        ) : (
          <Tag color="blue">UPDATE</Tag>
        ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value?: string | Date) =>
        value ? formatVNDate(String(value)) : "-",
    },
  ];

  const barConfig = {
    data: chartColumData,
    xField: "label",
    yField: "total",

    label: {
      position: "top",
    },
    xAxis: {
      label: {
        autoRotate: false,
      },
    },
  };

  const lineConfig = {
    data: lineChartData,
    xField: "label",
    yField: "total",
    smooth: true,
    point: { size: 4 },
  };

  return (
    <div className="px-4 py-4 min-h-screen">
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Insert hôm nay"
              value={dashboard.insert_today}
              valueStyle={{ color: "#3f8600" }}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="Update hôm nay"
              value={dashboard.update_today}
              valueStyle={{ color: "#1677ff" }}
              prefix={<EditOutlined />}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng Insert"
              value={dashboard.insert_total}
              valueStyle={{ color: "#389e0d" }}
            />
          </Card>
        </Col>

        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng Update"
              value={dashboard.update_total}
              valueStyle={{ color: "#0958d9" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className="mb-6">
        <Col span={12}>
          <Card title="Top 10 bảng uoload nhiều nhất theo tháng">
            <div style={{ height: 250 }}>
              <Column {...barConfig} />
            </div>
          </Card>
        </Col>

        <Col span={12}>
          <Card
            title="Upload theo thời gian"
            extra={
              <Select
                value={lineType}
                style={{ width: 120 }}
                onChange={(v) => setLineType(v)}
                options={[
                  { value: "DAY", label: "Theo ngày" },
                  { value: "MONTH", label: "Theo tháng" },
                  { value: "YEAR", label: "Theo năm" },
                ]}
              />
            }
          >
            <div style={{ height: 250 }}>
              <Line {...lineConfig} />
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Lịch sử Audit gần đây">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={actions}
          loading={loading}
          pagination={{
            current: page + 1,
            pageSize,
            total: totalPages * pageSize,
            onChange: (p, ps) => {
              setPage(p - 1);
              setPageSize(ps);
              fetchAuditActions(p - 1, ps);
            },
            showSizeChanger: true,
            pageSizeOptions: ["10", "50", "100"],
          }}
        />
      </Card>
    </div>
  );
};

export default DashboardWare;
