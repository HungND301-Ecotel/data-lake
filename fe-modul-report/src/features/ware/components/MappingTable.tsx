import React, { useEffect, useState, useRef } from "react";
import { Table, Button, Space, Modal, Input, Form, message, Row, Col } from "antd";
import type { ColumnsType } from "antd/es/table";
import { wareMappingApi } from "../api/wareMappingApi";
import type { WareMappingResponse, WareMappingRequest } from "../types/wareMapping";

interface MappingTableProps {
  templateId: string;
}

export const MappingTable: React.FC<MappingTableProps> = ({ templateId }) => {
  const [mappings, setMappings] = useState<WareMappingResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState(""); // ô nhập từ khóa
  const debounceRef = useRef<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMapping, setNewMapping] = useState<WareMappingRequest>({
    id: null,
    excelColumn: 0,
    fieldName: "",
    fieldType: "",
    defaultValue: "",
    wareTemplateId: Number(templateId),
  });

  // ----- Fetch mappings -----
  const fetchMappings = async (searchKeyword?: string) => {
    if (!templateId) return;
    setLoading(true);
    try {
      const res = await wareMappingApi.searchWareMapping({
        wareTemplateId: Number(templateId),
        keyword: searchKeyword ?? keyword,
      });
      setMappings(res);
    } catch (error) {
      message.error("Lấy danh sách mapping thất bại");
    } finally {
      setLoading(false);
    }
  };

  // ----- Debounce khi gõ keyword -----
  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchMappings(value);
    }, 500); // 0.5s
  };

  useEffect(() => {
    fetchMappings(); // load ban đầu
  }, [templateId]);

  // ----- Thêm mapping mới -----
  const handleAddMapping = () => {
    setNewMapping({
      id: null,
      excelColumn: 0,
      fieldName: "",
      fieldType: "",
      defaultValue: "",
      wareTemplateId: Number(templateId),
    });
    setIsModalOpen(true);
  };

  const handleModalOk = async () => {
    try {
      await wareMappingApi.saveWareMapping(newMapping);
      message.success("Thêm mapping thành công");
      setIsModalOpen(false);
      fetchMappings();
    } catch (error) {
      message.error("Thêm mapping thất bại");
    }
  };

  // ----- Xóa mapping -----
  const handleDeleteMapping = (id: number) => {
    Modal.confirm({
      title: "Bạn có chắc muốn xóa mapping này?",
      onOk: async () => {
        try {
          await wareMappingApi.deleteWareMapping(String(id));
          message.success("Xóa mapping thành công");
          fetchMappings();
        } catch (error) {
          message.error("Xóa mapping thất bại");
        }
      },
    });
  };

  // ----- Table columns -----
  const columns: ColumnsType<WareMappingResponse> = [
    { title: "Excel Column", dataIndex: "excelColumn", key: "excelColumn" },
    { title: "Field Name", dataIndex: "fieldName", key: "fieldName" },
    { title: "Field Type", dataIndex: "fieldType", key: "fieldType" },
    { title: "Default Value", dataIndex: "defaultValue", key: "defaultValue" },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            danger
            onClick={() => record.id !== null && handleDeleteMapping(record.id)}
          >
            Xóa
          </Button>
          {/* Nút chỉnh sửa: hiện modal hoặc inline edit */}
          <Button type="link" onClick={handleAddMapping}>
            Chỉnh sửa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* ===== Keyword + Thêm mapping ===== */}
      <Row style={{ marginBottom: 16 }} gutter={8} align="middle">
        <Col>
          <Input
            placeholder="Nhập keyword"
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            style={{ width: 200 }}
          />
        </Col>
        <Col>
          <Button type="dashed" onClick={handleAddMapping}>
            + Thêm Mapping
          </Button>
        </Col>
      </Row>

      {/* ===== Table ===== */}
      <Table
        rowKey={(record, index) => (record.id != null ? record.id : `new-${index}`)}
        columns={columns}
        dataSource={mappings}
        loading={loading}
        pagination={false}
      />

      {/* ===== Modal Thêm Mapping ===== */}
      <Modal
        title="Thêm Mapping mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleModalOk}
      >
        <Form layout="vertical">
          <Form.Item label="Excel Column">
            <Input
              type="number"
              value={newMapping.excelColumn}
              onChange={(e) =>
                setNewMapping({ ...newMapping, excelColumn: Number(e.target.value) })
              }
            />
          </Form.Item>
          <Form.Item label="Field Name">
            <Input
              value={newMapping.fieldName}
              onChange={(e) => setNewMapping({ ...newMapping, fieldName: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Field Type">
            <Input
              value={newMapping.fieldType}
              onChange={(e) => setNewMapping({ ...newMapping, fieldType: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Default Value">
            <Input
              value={newMapping.defaultValue}
              onChange={(e) =>
                setNewMapping({ ...newMapping, defaultValue: e.target.value })
              }
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
