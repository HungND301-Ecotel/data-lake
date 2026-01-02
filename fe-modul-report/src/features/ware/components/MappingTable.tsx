import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  message,
  Popconfirm,
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

  const [editingRequest, setEditingRequest] =
    useState<WareMappingRequest | null>(null);

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

        return (a.cellAddress ?? "").localeCompare(b.cellAddress ?? "", undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });

      setData(sorted);
    } catch (e) {
      message.error("Lấy dữ liệu mapping thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [templateId]);

  const isEditing = (record: WareMappingResponse) =>
    editingId === record.id || (record.id === null && editingId === null);

  const updateRequest = <K extends keyof WareMappingRequest>(
    key: K,
    value: WareMappingRequest[K]
  ) => {
    setEditingRequest((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleAdd = () => {
    setEditingId(null);

    setEditingRequest({
      id: null,
      fieldName: "",
      fieldType: "ROW",
      cellAddress: "",
      fieldValue: "",
      isKeyColumn: false,
      isScopFilter: false,
      wareTemplateId: templateId,
    });

    setData((prev) => [
      {
        id: null,
        fieldName: "",
        fieldType: "ROW",
        cellAddress: "",
        fieldValue: "",
        isKeyColumn: false,
        isScopFilter: false,
      },
      ...prev,
    ]);
  };

  const handleEdit = (record: WareMappingResponse) => {
    setEditingId(record.id!);

    setEditingRequest({
      id: record.id!,
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
    setEditingRequest(null);
    fetchData();
  };

  const handleSave = async () => {
    if (!editingRequest) return;

    try {
      if (!editingRequest.fieldName || !editingRequest.fieldType) {
        message.warning("Field Name và Field Type là bắt buộc");
        return;
      }

      if (editingRequest.id == null) {
        await wareMappingApi.saveWareMapping(editingRequest);
        message.success("Thêm mapping thành công");
      } else {
        await wareMappingApi.updateWareMapping(editingRequest);
        message.success("Cập nhật mapping thành công");
      }

      setEditingId(null);
      setEditingRequest(null);
      fetchData();
    } catch (e) {
      message.error("Lưu mapping thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await wareMappingApi.deleteWareMapping(String(id));
      message.success("Xóa mapping thành công");
      fetchData();
    } catch (e) {
      message.error("Xóa mapping thất bại");
    }
  };

  /* ================= COLUMNS ================= */
  const columns: ColumnsType<WareMappingResponse> = [
    {
      title: "Field Name",
      width: 150,
      render: (_, record) =>
        isEditing(record) ? (
          <Input
            value={editingRequest?.fieldName}
            onChange={(e) => updateRequest("fieldName", e.target.value)}
          />
        ) : (
          record.fieldName
        ),
    },
    {
      title: "Field Type",
      width: 130,
      align: "center",
      render: (_, record) =>
        isEditing(record) ? (
          <Select
            value={editingRequest?.fieldType}
            style={{ width: "100%" }}
            onChange={(v) => updateRequest("fieldType", v)}
            options={[
              { value: "ROW", label: "Đối chiếu cột" },
              { value: "CELL", label: "Đối chiếu ô" },
              { value: "TEXT", label: "Nhập dữ liệu" },
            ]}
          />
        ) : (
          record.fieldType
        ),
    },
    {
      title: "Cell Address",
      width: 120,
      align: "center",
      render: (_, record) =>
        isEditing(record) ? (
          <Input
            value={editingRequest?.cellAddress}
            onChange={(e) => updateRequest("cellAddress", e.target.value)}
          />
        ) : (
          record.cellAddress
        ),
    },
    {
      title: "Value / Default",
      width: 150,
      align: "center",
      render: (_, record) =>
        isEditing(record) ? (
          <Input
            value={editingRequest?.fieldValue}
            onChange={(e) => updateRequest("fieldValue", e.target.value)}
          />
        ) : (
          record.fieldValue
        ),
    },
    {
      title: "Key",
      width: 80,
      align: "center",
      render: (_, record) =>
        isEditing(record) ? (
          <Checkbox
            checked={editingRequest?.isKeyColumn}
            onChange={(e) => updateRequest("isKeyColumn", e.target.checked)}
          />
        ) : record.isKeyColumn ? (
          "✔️"
        ) : (
          ""
        ),
    },
    {
      title: "Scope",
      width: 80,
      align: "center",
      render: (_, record) =>
        isEditing(record) ? (
          <Checkbox
            checked={editingRequest?.isScopFilter}
            onChange={(e) => updateRequest("isScopFilter", e.target.checked)}
          />
        ) : record.isScopFilter ? (
          "✔️"
        ) : (
          ""
        ),
    },
    {
      title: "Action",
      width: 160,
      align: "center",
      render: (_, record) =>
        isEditing(record) ? (
          <>
            <Button type="link" icon={<SaveOutlined />} onClick={handleSave}>
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: "bold", margin: 0 }}>
          Cấu hình dữ liệu
        </h1>

        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Thêm mới
        </Button>
      </div>

      <Table
        rowKey={(record) => record.id ?? "new"}
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={false}
        bordered
        size="small"
      />
    </div>
  );
};
