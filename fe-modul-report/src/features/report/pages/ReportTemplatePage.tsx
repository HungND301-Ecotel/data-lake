import { useEffect, useState } from "react";
import { Card, Progress, Row, Col, Input, Pagination, message } from "antd";
import { useNavigate } from "react-router-dom";
import { departmentApi } from "../../department/api/departmentApi";
import { reportCategoryApi } from "../../category/reportCategory/api/reportCategoryApi";
import type { DepartmentResponse } from "../../department/types/department";

const ReportTemplatePage = () => {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(8);
  const [keyword, setKeyword] = useState("");
  const [reportCounts, setReportCounts] = useState<
    Record<string, Record<string, number>>
  >({});

  const navigate = useNavigate();

  const loadDepartments = async (page: number, keyword: string) => {
    try {
      const res = await departmentApi.getMyDepartment(keyword, page, limit);
      setDepartments(res.content);
      setTotal(res.totalElements);

      const counts = await Promise.all(
        res.content.map(async (dep) => {
          const countRes = await reportCategoryApi.getCountByDepartment(
            dep.id!
          );
          return { depId: dep.id!, counts: countRes };
        })
      );

      const newReportCounts: Record<string, Record<string, number>> = {};
      counts.forEach((item) => {
        newReportCounts[item.depId] = item.counts;
      });

      setReportCounts(newReportCounts);
    } catch (err) {
      console.log(err);
      message.error("Lỗi tải phòng ban");
    }
  };

  useEffect(() => {
    loadDepartments(page, keyword);
  }, [page, keyword]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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
          const counts = reportCounts[dep.id!] || {};
          const totalCount =
            Object.values(counts).reduce((a, b) => a + b, 0) || 1;

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
                  navigate(`/reports/template/department/${dep.id}`)
                }
              >
                {Object.entries(counts).map(([reportName, value]) => (
                  <div key={reportName} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      {reportName}
                    </div>
                    <Progress
                      percent={
                        ((value / totalCount) * 100).toFixed(
                          1
                        ) as unknown as number
                      }
                      status="active"
                    />
                  </div>
                ))}
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default ReportTemplatePage;
