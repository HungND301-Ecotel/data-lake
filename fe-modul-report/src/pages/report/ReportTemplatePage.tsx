import { useEffect, useState } from "react";
import { Collapse, Table, Space, Button, Spin } from "antd";
import { DownloadOutlined, EditOutlined, PlayCircleOutlined } from "@ant-design/icons";
import { fetchDepartments, fetchReportsByCategory } from "../../services/report/fetch";
import type { Department, Report } from "../../services/report/fetch";

const { Panel } = Collapse;

const ReportTemplatePage = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [reportsMap, setReportsMap] = useState<Record<string, Report[]>>({});
  const [loadingCategory, setLoadingCategory] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadDepartments = async () => {
      const data = await fetchDepartments();
      setDepartments(data);
    };
    loadDepartments();
  }, []);

  const handleCategoryClick = async (categoryId: string) => {
    if (reportsMap[categoryId]) return; // đã load rồi
    setLoadingCategory((prev) => ({ ...prev, [categoryId]: true }));
    const data = await fetchReportsByCategory(categoryId);
    setReportsMap((prev) => ({ ...prev, [categoryId]: data }));
    setLoadingCategory((prev) => ({ ...prev, [categoryId]: false }));
  };

  const columns = [
    { title: "Tên báo cáo", dataIndex: "name", key: "name" },
    { title: "Loại file", dataIndex: "type", key: "type" },
    { title: "Loại báo cáo", dataIndex: "reportMode", key: "reportMode" },
    { title: "Ngày tạo", dataIndex: "createdAt", key: "createdAt" },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: Report) => (
        <Space>
          {record.reportMode === "Static" ? (
            <Button type="link" icon={<DownloadOutlined />}>Tải về</Button>
          ) : (
            <>
              <Button type="link" icon={<EditOutlined />}>Chỉnh sửa</Button>
              <Button type="link" icon={<PlayCircleOutlined />}>Tạo</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 bg-white" style={{ width: "100%", minHeight: "100%" }}>
      {departments.map((dept) => (
        <div
          key={dept.id}
          className="mb-6"
          style={{ display: "flex" }}
        >
          {/* Đường dọc bên trái */}
          <div
            style={{
              width: 4,
              backgroundColor: "#1890ff",
              borderRadius: 2,
              marginRight: 16,
            }}
          />

          {/* Nội dung phòng ban */}
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: "0 0 16px 0", fontWeight: 700, color: "#1890ff" }}>
              {dept.name}
            </h2>

            {/* Collapse categories không giới hạn mở */}
            <Collapse accordion={false}>
              {dept.categories.map((cat) => (
                <Panel
                  header={cat.name}
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                >
                  {loadingCategory[cat.id] ? (
                    <Spin />
                  ) : reportsMap[cat.id] && reportsMap[cat.id].length > 0 ? (
                    <Table
                      columns={columns}
                      dataSource={reportsMap[cat.id]}
                      rowKey="id"
                      pagination={{ pageSize: 5 }}
                      size="small"
                    />
                  ) : (
                    <p>Chưa có báo cáo</p>
                  )}
                </Panel>
              ))}
            </Collapse>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportTemplatePage;
