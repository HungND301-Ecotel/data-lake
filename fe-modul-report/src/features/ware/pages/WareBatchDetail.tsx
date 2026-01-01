import React, { useEffect, useState } from "react";
import { Table, Input, Row, Col, Button, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams } from "react-router-dom";
import { wareDataRowApi } from "../api/wareDataRowApi";
import { wareMappingApi } from "../api/wareMappingApi";
import type { WareDataRowResponse } from "../types/wareDataRow";
import type { WareMappingResponse } from "../types/wareMapping";


export const WareBatchDetail: React.FC = () => {
    const wareBatchId = Number(useParams<{ wareBatchId: string }>().wareBatchId ?? 0);

  const wareTemplateId = Number(1);

  const [rows, setRows] = useState<WareDataRowResponse[]>([]);
  const [mappings, setMappings] = useState<WareMappingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");

  // ----- Fetch Mapping -----
  const fetchMappings = async () => {
    if (!wareTemplateId) return;
    try {
      const res = await wareMappingApi.searchWareMapping({
        wareTemplateId,
      });
      setMappings(res.sort((a, b) => a.excelColumn - b.excelColumn));
    } catch (error) {
      message.error("Lấy mapping thất bại");
    }
  };

  // ----- Fetch Rows -----
  const fetchRows = async () => {
    if (!wareBatchId) return;
    setLoading(true);
    try {
      const res = await wareDataRowApi.searchWareDataRow({
        wareBatchId,
        keyword,
        page: 0,
        limit: 1000,
      });
      setRows(res.content);
    } catch (error) {
      message.error("Lấy dữ liệu thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, [wareTemplateId]);

  useEffect(() => {
    fetchRows();
  }, [wareBatchId, keyword]);

  // ----- Dynamic Columns -----
  const defaultColumns: ColumnsType<WareDataRowResponse> = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "Created At", dataIndex: "createdAt", key: "createdAt" },
    { title: "Updated At", dataIndex: "updatedAt", key: "updatedAt" },
  ];

  const mappingColumns: ColumnsType<WareDataRowResponse> = mappings.map((m) => ({
    title: m.fieldName,
    dataIndex: ["data", m.fieldName],
    key: m.fieldName,
    render: (value) => (value == null ? "" : value.toString()),
  }));

  const columns = [...defaultColumns, ...mappingColumns];

  return (
    <div>
      {/* ===== Keyword Search ===== */}
      <Row style={{ marginBottom: 16 }} gutter={8}>
        <Col span={8}>
          <Input
            placeholder="Nhập keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={fetchRows}
          />
        </Col>
        <Col>
          <Button type="primary" onClick={fetchRows}>
            Tìm kiếm
          </Button>
        </Col>
      </Row>

      {/* ===== Table Data ===== */}
      <Table
        rowKey={(record) => record.id ?? Math.random()}
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
};
