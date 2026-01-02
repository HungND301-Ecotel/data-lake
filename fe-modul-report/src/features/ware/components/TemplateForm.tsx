import React, { useEffect, useState } from "react";
import { Form, Input, Button, message, Divider, Card, Row, Col } from "antd";
import type { WareTemplateRequest, WareTemplateResponse } from "../types/wareTemplate";
import { wareTemplateApi } from "../api/wareTemplateApi";

interface TemplateFormProps {
  templateId: number;
}

export const TemplateForm: React.FC<TemplateFormProps> = ({ templateId }) => {
  const [template, setTemplate] = useState<WareTemplateResponse | null>(null);
  const [form] = Form.useForm<WareTemplateRequest>();
  const [isEditing, setIsEditing] = useState(false);

  const fetchTemplate = async () => {
    try {
      const res = await wareTemplateApi.getWareTemplateById(templateId);
      setTemplate(res);

      form.setFieldsValue({
        name: res.name,
        tableName: res.tableName,
        tableCode: res.tableCode,
        code: res.code,
        description: res.description,
        startRow: res.startRow,
      });
    } catch (err) {
      console.error(err);
      message.error("Lấy thông tin template thất bại");
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await wareTemplateApi.updateWareTemplate({
        ...values,
        id: template?.id ?? null,
      });
      message.success("Cập nhật template thành công");
      setIsEditing(false);
      fetchTemplate();
    } catch (err) {
      console.error(err);
      message.error("Cập nhật template thất bại");
    }
  };

  // ================= Button render cho tiêu đề Card =================
  const cardExtra = isEditing ? (
    <>
      <Button style={{ marginRight: 8 }} onClick={() => { setIsEditing(false); fetchTemplate(); }}>
        Hủy
      </Button>
      <Button type="primary" onClick={handleSave}>
        Lưu
      </Button>
    </>
  ) : (
    <Button type="primary" onClick={() => setIsEditing(true)}>Sửa</Button>
  );

  return (
    <Card title="Template Details" extra={cardExtra} bordered >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
        <Col span={12}>
            <Form.Item name="code" label="Template Code">
              <Input disabled /> {/* Không sửa */}
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="name" label="Template Name" rules={[{ required: true }]}>
              <Input disabled={!isEditing} />
            </Form.Item>
          </Col>
          
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="tableCode" label="Table Code">
              <Input disabled={!isEditing} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="tableName" label="Table Name">
              <Input disabled={!isEditing} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="description" label="Description">
              <Input disabled={!isEditing} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="startRow" label="Start Row">
              <Input type="number" disabled={!isEditing} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Created At">
              <Input
                value={template ? new Date(template.createdAt).toLocaleString() : ""}
                disabled
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Updated At">
              <Input
                value={template ? new Date(template.updatedAt).toLocaleString() : ""}
                disabled
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};
