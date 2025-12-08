import { useEffect, useState } from "react";
import { Card, Progress, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";

type ReportStorage = {
  department_id: number;
  department_name: string;
  pending_count: number;
  processing_count: number;
  success_count: number;
};

const ReportStoragePage = () => {
  const [data, setData] = useState<ReportStorage[]>([]);
  const navigate = useNavigate();

  // Fake data
  useEffect(() => {
    const fake = [
      {
        department_id: 1,
        department_name: "Phòng Nhân Sự",
        pending_count: 5,
        processing_count: 12,
        success_count: 40,
      },
      {
        department_id: 2,
        department_name: "Phòng Kế Toán",
        pending_count: 2,
        processing_count: 6,
        success_count: 25,
      },
      {
        department_id: 3,
        department_name: "Phòng IT",
        pending_count: 10,
        processing_count: 4,
        success_count: 15,
      },
      {
        department_id: 4,
        department_name: "Phòng Marketing",
        pending_count: 1,
        processing_count: 2,
        success_count: 30,
      },
    ];

    setTimeout(() => setData(fake), 400);
  }, []);

  const calcPercent = (count: number, total: number) => {
    if (total === 0) return 0;
    return Number(((count / total) * 100).toFixed(1));
  };

  return (
    <div style={{  }}>
      <Row gutter={[24, 24]}>
        {data.map((item) => {
          const total =
            item.pending_count +
            item.processing_count +
            item.success_count;

          return (
            <Col span={6} key={item.department_id}>
              <Card
                title={item.department_name}
                hoverable
                style={{
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate(`/reports/storage/department/${item.department_id}`)
                }
              >
                <div style={{ marginBottom: 6, fontWeight: 500 }}>
                  Pending: {item.pending_count}
                </div>
                <Progress
                  percent={calcPercent(item.pending_count, total)}
                  status="exception"
                />

                <div style={{ margin: "14px 0 6px", fontWeight: 500 }}>
                  Processing: {item.processing_count}
                </div>
                <Progress
                  percent={calcPercent(item.processing_count, total)}
                />

                <div style={{ margin: "14px 0 6px", fontWeight: 500 }}>
                  Success: {item.success_count}
                </div>
                <Progress
                  percent={calcPercent(item.success_count, total)}
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
