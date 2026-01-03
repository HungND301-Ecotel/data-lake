import React, { useEffect, useState } from "react";
import { Table, Input, Row, Col, Button, message, Switch } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams } from "react-router-dom";
import { wareDataRowApi } from "../api/wareDataRowApi";
import { wareMappingApi } from "../api/wareMappingApi";
import type { WareDataRowResponse } from "../types/wareDataRow";
import type { WareMappingResponse } from "../types/wareMapping";
import { wareBatchApi } from "../api/wareBathApi";

export const WareBatchDetail: React.FC = () => {
  const wareBatchId = Number(useParams<{ wareBatchId: string }>().wareBatchId ?? 0);

  const [rows, setRows] = useState<WareDataRowResponse[]>([]);
  const [mappings, setMappings] = useState<WareMappingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [deleteMissing, setDeleteMissing] = useState(false);

  const fetchMappings = async () => {
    try {
      const res = await wareMappingApi.getByBatch(wareBatchId);
      setMappings(res);
    } catch (error) {
      message.error("Lấy mapping thất bại");
    }
  };

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
  }, [wareBatchId]);

  useEffect(() => {
    fetchRows();
  }, [wareBatchId, keyword]);

  const defaultColumns: ColumnsType<WareDataRowResponse> = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
  
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => formatVNDate(value),
    },
  
    {
      title: "Cập nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (value: string) => formatVNDate(value),
    },
  ];
  

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

  const mappingColumns: ColumnsType<WareDataRowResponse> = mappings.map((m) => ({
    title: m.fieldName,
    dataIndex: ["data", m.fieldName],
    key: m.fieldName,
    render: (value) => (value == null ? "" : value.toString()),
  }));

  const columns = [...defaultColumns, ...mappingColumns];

  const handlePush = async () => {
    if (!wareBatchId) return;
    try {
      await wareBatchApi.pushWareBatch({
        id: wareBatchId,
        deleteMissing,
      });
      message.success("Push dữ liệu thành công!");
    } catch (error) {
      message.error("Push dữ liệu thất bại");
    }
  };

  return (
    <div>
      <Row style={{ marginBottom: 16 }} gutter={8} align="middle">
        <Col span={6}>
          <Input
            placeholder="Nhập keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={fetchRows}
          />
        </Col>

        <Col>
          <span>Delete Missing:</span>
          <Switch
            style={{ marginLeft: 8 }}
            checked={deleteMissing}
            onChange={setDeleteMissing}
          />
        </Col>
        <Col>
          <Button type="default" onClick={handlePush}>
            Update
          </Button>
        </Col>
      </Row>

      <Table
        rowKey={(record) => record.id ?? Math.random()}
        columns={columns}
        dataSource={rows}
        loading={loading}
      />
    </div>
  );
};
