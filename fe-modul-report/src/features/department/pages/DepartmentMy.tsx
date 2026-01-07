import { useEffect, useState } from "react";
import { Card, Row, Col, Spin, message } from "antd";

import { departmentApi } from "../api/departmentApi";
import type { DepartmentResponse } from "../types/department";
import { useNavigate } from "react-router-dom";

const DepartmentMy = () => {
  const [data, setData] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const nav = useNavigate();
  const handleClickDepartment = (departmentId: string | null) => {
    nav(`/ware/department/${departmentId}`);
  };
  const loadDepartments = async () => {
    try {
      setLoading(true);
      const res = await departmentApi.getMyDepartment(
        "", 
        0,
        1000 // max
      );
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

  return (
    <div>
      {contextHolder}

      {loading ? (
        <Spin />
      ) : (
        <Row gutter={[16, 16]}>
          {data.map((dept) => (
            <Col xs={24} sm={12} md={8} lg={6} key={dept.id}>
              <Card
                title={dept.name}
                bordered
                hoverable
                headStyle={{
                  background: "#1a8649",
                  color: "#fff",
                  fontWeight: 600,
                }}
                
                onClick={() => {
                  handleClickDepartment(dept.id);
                }}
              >
                <p>
                  <b>Mã:</b> {dept.code}
                </p>
                <p>
                  <b>Mô tả:</b> {dept.description || "—"}
                </p>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default DepartmentMy;
