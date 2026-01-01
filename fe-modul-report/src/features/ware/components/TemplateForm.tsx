import React, { useEffect, useState } from "react";
import { Form, Input, Row, Col, Button, message } from "antd";
import type { WareTemplateResponse } from "../types/wareTemplate";
import { wareTemplateApi } from "../api/wareTemplateApi";

interface TemplateFormProps {
  templateId: string;
}

export const TemplateForm: React.FC<TemplateFormProps> = ({ templateId }) => {
  const [template, setTemplate] = useState<WareTemplateResponse | null>(null);
  const [templateForm] = Form.useForm<WareTemplateResponse>();
  const [isEditing, setIsEditing] = useState(false);

  // ------------------ Fetch template ------------------
  const fetchTemplate = async () => {
    try {
      const res = await wareTemplateApi.getWareTemplateById(Number(templateId));
      setTemplate(res);
      templateForm.setFieldsValue(res);
    } catch (error) {
      message.error("Lấy thông tin template thất bại");
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  // ------------------ Save handler ------------------
  const handleSave = async () => {
    try {
      const values = await templateForm.validateFields();
      if (!template) return;
      await wareTemplateApi.updateWareTemplate({ ...values, id: template.id });
      message.success("Cập nhật template thành công");
      setIsEditing(false);
      fetchTemplate();
    } catch (error) {
      message.error("Cập nhật template thất bại");
    }
  };

  return (
    <Form
  form={templateForm}
  layout="vertical"
  style={{ marginBottom: 24 }}
>
  {/* ===== Row 1: name, tableName, tableCode ===== */}
  <Row gutter={16}>
    <Col span={6}>
      <Form.Item
        name="name"
        label="Template Name"
        rules={[{ required: true, message: "Vui lòng nhập tên template" }]}
      >
        <Input disabled={!isEditing} />
      </Form.Item>
    </Col>
    <Col span={6}>
      <Form.Item name="tableName" label="Table Name">
        <Input disabled={!isEditing} />
      </Form.Item>
    </Col>
    <Col span={6}>
      <Form.Item name="tableCode" label="Table Code">
        <Input disabled={!isEditing} />
      </Form.Item>
    </Col>
    <Col span={6} style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
      {isEditing ? (
        <Button type="primary" onClick={handleSave}>
          Lưu
        </Button>
      ) : (
        <Button type="default" onClick={() => setIsEditing(true)}>
          Sửa
        </Button>
      )}
    </Col>
  </Row>

  {/* ===== Row 2: keyColumns, scopeFilter, startRow ===== */}
  <Row gutter={16}>
    <Col span={6}>
      <Form.Item name="keyColumns" label="Key Columns">
        <Input disabled={!isEditing} />
      </Form.Item>
    </Col>
    <Col span={6}>
      <Form.Item name="scopeFilter" label="Scope Filter">
        <Input disabled={!isEditing} />
      </Form.Item>
    </Col>
    <Col span={6}>
      <Form.Item name="startRow" label="Start Row">
        <Input type="number" disabled={!isEditing} />
      </Form.Item>
    </Col>
  </Row>
</Form>

  );
};
