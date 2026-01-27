import { useEffect, useState } from "react";
import { Card, Table, Spin, message, Tag, Button, Space, Empty } from "antd";
import { TeamOutlined, EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { DepartmentResponse } from "../types/department";
import { departmentApi } from "../api/departmentApi";

const DepartmentMy = () => {
  const [data, setData] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const nav = useNavigate();

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const res = await departmentApi.getMyDepartment("", 0, 1000);
      setData(res.content);
    } catch (error) {
      console.error(error);
      messageApi.error("Không lấy được danh sách phòng ban");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleViewDepartment = (departmentId: string | null) => {
    nav(`/ware/department/${departmentId}`);
  };

  const columns = [
    {
      title: "Mã phòng ban",
      dataIndex: "code",
      align: "center" as const,
      key: "code",
      width: "15%",
      render: (text: string) => (
        <div className="flex justify-center items-center gap-2 text-center">
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: "Tên phòng ban",
      dataIndex: "name",
      key: "name",
      width: "30%",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <TeamOutlined className="text-gray-400" />
          <span className="font-medium text-gray-800">{text}</span>
        </div>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: "45%",
      render: (text: string) => (
        <span className="text-gray-600">{text || "-"}</span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: "10%",
      align: "center" as const,
      render: (_: any, record: DepartmentResponse) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewDepartment(record.id)}
            className="bg-green-600! hover:bg-green-700! text-white border-0 shadow-md"
            size="large"
          >
            Xem
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="px-6 py-6 min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {contextHolder}

      {/* Main Card */}
      <Card className="shadow-lg border-0 rounded-xl">
        {/* Statistics Bar */}
        <div className="mb-6 p-4 bg-linear-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TeamOutlined className="text-green-500 text-xl" />
              <span className="font-medium text-gray-700">
                Phòng ban của bạn:
              </span>
              <Tag color="green" className="font-bold text-base px-3 py-1">
                {data.length}
              </Tag>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : data.length === 0 ? (
          <Empty
            description="Chưa có phòng ban nào"
            style={{ marginTop: 50, marginBottom: 50 }}
          />
        ) : (
          <Table
            dataSource={data}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 10,
              total: data.length,
              showSizeChanger: false,
              showTotal: (total) => `Tổng ${total} phòng ban`,
              className: "mt-4",
            }}
            size="middle"
            scroll={{ x: "100%" }}
            className="modern-department-table"
            rowClassName="hover:bg-green-50 transition-colors"
          />
        )}
      </Card>

      <style>{`
        .modern-department-table .ant-table {
          font-size: 14px;
        }
        .modern-department-table .ant-table-thead > tr > th {
          background: linear-gradient(to right, #f8fafc, #f1f5f9);
          color: #1e293b;
          font-weight: 600;
          border-bottom: 2px solid #e2e8f0;
          padding: 16px;
        }
        .modern-department-table .ant-table-tbody > tr > td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .modern-department-table .ant-table-tbody > tr:hover > td {
          background: #f0fdf4 !important;
        }
        .ant-card {
          border-radius: 16px;
        }
        .bg-gradient-to-br {
          background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
        }
      `}</style>
    </div>
  );
};

export default DepartmentMy;