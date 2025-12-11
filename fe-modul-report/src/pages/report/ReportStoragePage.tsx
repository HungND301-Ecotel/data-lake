import { useEffect, useState } from "react";
import { Card, Progress, Row, Col, Input, Pagination, message } from "antd";
import { useNavigate } from "react-router-dom";
import { departmentApi } from "../../services/departmentApi";
import { reportStorageApi } from "../../services/reportStorageApi";
import type { DepartmentResponse } from "../../types/department";

type ReportStorage = {
  departmentId: string;
  departmentName: string;
  pending: number;
  processing: number;
  success: number;
};

const ReportStoragePage = () => {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [reportCounts, setReportCounts] = useState<
    Record<string, ReportStorage>
  >({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(8);
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  const loadDepartments = async (page: number, keyword: string) => {
    try {
      const res = await departmentApi.getMyDepartment(keyword, page, limit);
      setDepartments(res.content);
      setTotal(res.totalElements);

      const counts = await Promise.all(
        res.content.map(async (dep) => {
          const statusCounts =
            await reportStorageApi.getCountStatusByDepartment(dep.id!);
          return {
            departmentId: dep.id!,
            departmentName: dep.name,
            pending: statusCounts.PENDING || 0,
            processing: statusCounts.IN_PROGRESS || 0,
            success: statusCounts.SUCCESS || 0,
          };
        })
      );

      const newCounts: Record<string, ReportStorage> = {};
      counts.forEach((item) => {
        newCounts[item.departmentId] = item;
      });
      setReportCounts(newCounts);
    } catch (err) {
      console.error(err);
      message.error("Lỗi tải phòng ban hoặc số liệu báo cáo");
    }
  };

  useEffect(() => {
    loadDepartments(page, keyword);
  }, [page, keyword]);

  const calcPercent = (count: number, total: number) =>
    total ? Number(((count / total) * 100).toFixed(1)) : 0;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Input.Search
          placeholder="Tìm kiếm phòng ban"
          style={{ width: 300 }}
          onSearch={(value) => {
            setKeyword(value);
            setPage(0);
          }}
          allowClear
        />
        <Pagination
          current={page + 1}
          pageSize={limit}
          total={total}
          onChange={(p) => setPage(p - 1)}
          size="small"
        />
      </div>

      <Row gutter={[24, 24]}>
        {departments.map((dep) => {
          const item = reportCounts[dep.id!] || {
            pending: 0,
            processing: 0,
            success: 0,
            departmentId: dep.id!,
            departmentName: dep.name,
          };
          const totalCount = item.pending + item.processing + item.success || 1;

          return (
            <Col span={6} key={dep.id}>
              <Card
                title={dep.name}
                hoverable
                style={{
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate(`/reports/storage/department/${dep.id}`)
                }
              >
                <div style={{ marginBottom: 6, fontWeight: 500 }}>
                  Pending: {item.pending}
                </div>
                <Progress
                  percent={calcPercent(item.pending, totalCount)}
                  status="exception"
                />

                <div style={{ margin: "14px 0 6px", fontWeight: 500 }}>
                  Processing: {item.processing}
                </div>
                <Progress
                  percent={calcPercent(item.processing, totalCount)}
                  status="active"
                />

                <div style={{ margin: "14px 0 6px", fontWeight: 500 }}>
                  Success: {item.success}
                </div>
                <Progress
                  percent={calcPercent(item.success, totalCount)}
                  status="success"
                />
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default ReportStoragePage;
