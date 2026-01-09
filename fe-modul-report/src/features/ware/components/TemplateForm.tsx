import React, { useEffect, useState } from "react";
import { Input, Button, message, Row, Col } from "antd";
import type {
  WareTemplateRequest,
  WareTemplateResponse,
} from "../types/wareTemplate";
import { wareTemplateApi } from "../api/wareTemplateApi";
import { EditOutlined } from "@ant-design/icons";

interface TemplateFormProps {
  templateId: number;
}

export const TemplateForm: React.FC<TemplateFormProps> = ({ templateId }) => {
  const [template, setTemplate] = useState<WareTemplateResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [request, setRequest] = useState<WareTemplateRequest | null>(null);

  const fetchTemplate = async () => {
    try {
      const res = await wareTemplateApi.getWareTemplateById(templateId);
      setTemplate(res);

      setRequest({
        id: res.id,
        code: res.code,
        name: res.name,
        description: res.description,
        startRow: res.startRow,
        wareCategoryId: 0,
        tableName: res.tableName,
        tableCode: res.tableCode,
      });
    } catch (err) {
      message.error("Lấy thông tin template thất bại");
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const updateField = <K extends keyof WareTemplateRequest>(
    key: K,
    value: WareTemplateRequest[K]
  ) => {
    setRequest((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!request) return;

    if (!request.name) {
      message.warning("Template Name không được để trống");
      return;
    }

    try {
      await wareTemplateApi.updateWareTemplate(request);
      message.success("Cập nhật template thành công");
      setIsEditing(false);
      fetchTemplate();
    } catch (err) {
      message.error(
        (err as any)?.response?.data?.message || "Cập nhật template thất bại"
      );
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchTemplate();
  };

  if (!request) return null;

  return (
    <div className="px-4 py-4" style={{ background: "#fff" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: "bold", margin: 0 }}>
          Cấu hình dữ liệu
        </h1>

        {isEditing ? (
          <div>
            <Button style={{ marginRight: 8 }} onClick={handleCancel}>
              Hủy
            </Button>
            <Button type="primary" onClick={handleSave}>
              Lưu
            </Button>
          </div>
        ) : (
          <Button type="primary" className="bg-[#1a8649]! hover:bg-[#15703d]!" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
            Chỉnh sửa
          </Button>
        )}
      </div>

      <Row gutter={16}>
        <Col span={12}>
          <label>Template Code</label>
          <Input value={request.code ?? ""} disabled />
        </Col>

        <Col span={12}>
          <label>Template Name</label>
          <Input
            value={request.name}
            disabled={!isEditing}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 12 }}>
        <Col span={12}>
          <label>Table Code</label>
          <Input
            value={request.tableCode}
            disabled={!isEditing}
            onChange={(e) => updateField("tableCode", e.target.value)}
          />
        </Col>

        <Col span={12}>
          <label>Table Name</label>
          <Input
            value={request.tableName}
            disabled={!isEditing}
            onChange={(e) => updateField("tableName", e.target.value)}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 12 }}>
        <Col span={12}>
          <label>Description</label>
          <Input
            value={request.description}
            disabled={!isEditing}
            onChange={(e) => updateField("description", e.target.value)}
          />
        </Col>

        <Col span={12}>
          <label>Start Row</label>
          <Input
            type="number"
            value={request.startRow}
            disabled={!isEditing}
            onChange={(e) => updateField("startRow", Number(e.target.value))}
          />
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 12 }}>
        <Col span={12}>
          <label>Created At</label>
          <Input
            value={
              template ? new Date(template.createdAt).toLocaleString() : ""
            }
            disabled
          />
        </Col>

        <Col span={12}>
          <label>Updated At</label>
          <Input
            value={
              template ? new Date(template.updatedAt).toLocaleString() : ""
            }
            disabled
          />
        </Col>
      </Row>
    </div>
  );
};
