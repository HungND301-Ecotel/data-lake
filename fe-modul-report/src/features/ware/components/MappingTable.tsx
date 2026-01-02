import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  message,
  Popconfirm,
  Form,
  Checkbox,
  Select,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type {
  WareMappingResponse,
  WareMappingRequest,
} from "../types/wareMapping";
import { wareMappingApi } from "../api/wareMappingApi";

export const MappingTable: React.FC<{ templateId: number }> = ({
  templateId,
}) => {
  const [data, setData] = useState<WareMappingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form] = Form.useForm<WareMappingRequest>();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await wareMappingApi.getByBatch(templateId);

      const typeOrder = ["CELL", "TEXT", "ROW"];
      const sorted = [...res].sort((a, b) => {
        const typeDiff =
          typeOrder.indexOf(a.fieldType ?? "") -
          typeOrder.indexOf(b.fieldType ?? "");
        if (typeDiff !== 0) return typeDiff;

        const aAddr = a.cellAddress ?? "";
        const bAddr = b.cellAddress ?? "";

        return aAddr.localeCompare(bAddr, undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });

      setData(sorted);
    } catch (err) {
      console.error(err);
      message.error("Lấy dữ liệu mapping thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [templateId]);

  // ================= Handlers =================
  const handleEdit = (record: WareMappingResponse) => {
    setEditingId(record.id);
    form.setFieldsValue({
      id: record.id,
      fieldName: record.fieldName,
      fieldType: record.fieldType,
      cellAddress: record.cellAddress,
      fieldValue: record.fieldValue ?? "",
      isKeyColumn: record.isKeyColumn ?? false,
      isScopFilter: record.isScopFilter ?? false,
      wareTemplateId: templateId,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleSave = async (id: number) => {
    try {
      const values = await form.validateFields();
      await wareMappingApi.saveWareMapping(values);
      message.success("Lưu mapping thành công");
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      message.error("Lưu mapping thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await wareMappingApi.deleteWareMapping(String(id));
      message.success("Xóa mapping thành công");
      fetchData();
    } catch (err) {
      console.error(err);
      message.error("Xóa mapping thất bại");
    }
  };

  // ================= Table columns =================
  const columns: ColumnsType<WareMappingResponse> = [
    {
      title: "Field Name",
      dataIndex: "fieldName",
      key: "fieldName",
      width: 150,
      render: (_, record) =>
        editingId === record.id ? (
          <Form.Item
            name="fieldName"
            style={{ margin: 0 }}
            rules={[{ required: true }]}
          >
            <Input placeholder="Field Name" />
          </Form.Item>
        ) : (
          record.fieldName
        ),
    },
    {
      title: "Field Type",
      dataIndex: "fieldType",
      key: "fieldType",
      width: 120,
      align: "center",
      render: (_, record) =>
        editingId === record.id ? (
          <Form.Item
            name="fieldType"
            style={{ margin: 0 }}
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: "ROW", label: "Đối chiếu cột" },
                { value: "CELL", label: "Đối chiếu ô" },
                { value: "TEXT", label: "Nhập dữ liệu" },
              ]}
            />
          </Form.Item>
        ) : (
          record.fieldType
        ),
    },
    {
      title: "Cell Address",
      dataIndex: "cellAddress",
      key: "cellAddress",
      width: 120,
      align: "center",
      render: (_, record) =>
        editingId === record.id ? (
          <Form.Item name="cellAddress" style={{ margin: 0 }}>
            <Input placeholder="Cell Address" />
          </Form.Item>
        ) : (
          record.cellAddress
        ),
    },
    {
      title: "Value / Default",
      dataIndex: "fieldValue",
      key: "fieldValue",
      width: 150,
      align: "center",
      render: (_, record) =>
        editingId === record.id ? (
          <Form.Item name="fieldValue" style={{ margin: 0 }}>
            <Input placeholder="Default / Value" />
          </Form.Item>
        ) : (
          record.fieldValue
        ),
    },
    {
      title: "Key",
      dataIndex: "isKeyColumn",
      key: "isKeyColumn",
      width: 80,
      align: "center",
      render: (_, record) =>
        editingId === record.id ? (
          <Form.Item
            name="isKeyColumn"
            style={{ margin: 0 }}
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
        ) : record.isKeyColumn ? (
          "✔️"
        ) : (
          ""
        ),
    },
    {
      title: "Scope",
      dataIndex: "isScopFilter",
      key: "isScopFilter",
      width: 80,
      align: "center",
      render: (_, record) =>
        editingId === record.id ? (
          <Form.Item
            name="isScopFilter"
            style={{ margin: 0 }}
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
        ) : record.isScopFilter ? (
          "✔️"
        ) : (
          ""
        ),
    },
    {
      title: "Action",
      key: "action",
      width: 160,
      align: "center",
      render: (_, record) =>
        editingId === record.id ? (
          <>
            <Button
              type="link"
              icon={<SaveOutlined />}
              onClick={() => handleSave(record.id!)}
              style={{ marginRight: 8 }}
            >
              Lưu
            </Button>
            <Button type="link" icon={<CloseOutlined />} onClick={handleCancel}>
              Hủy
            </Button>
          </>
        ) : (
          <>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              style={{ marginRight: 8 }}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Bạn có chắc muốn xóa?"
              onConfirm={() => handleDelete(record.id!)}
            >
              <Button type="link" icon={<DeleteOutlined />} danger>
                Xóa
              </Button>
            </Popconfirm>
          </>
        ),
    },
  ];

  return (
    <div style={{ paddingTop: 16 }}>
      {/* ===== Header + Button ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontWeight: "bold", fontSize: 20, margin: 0 }}>
          Cấu hình dữ liệu
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            const newItem: WareMappingResponse = {
              id: null,
              fieldName: "",
              fieldType: "ROW",
              cellAddress: "",
              isKeyColumn: false,
              isScopFilter: false,
              fieldValue: "",
            };
            setData([newItem, ...data]);
            setEditingId(-1);
            form.setFieldsValue({ ...newItem, wareTemplateId: templateId });
          }}
        >
          Thêm Mapping
        </Button>
      </div>

      {/* ===== Form + Table ===== */}
      <Form form={form} component={false}>
        <Table
          rowKey={(record) => record.id ?? Math.random()}
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          bordered
          size="small"
        />
      </Form>
    </div>
  );
};
