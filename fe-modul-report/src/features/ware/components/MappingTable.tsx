import React, { useEffect, useState } from "react";
import { Table, Input, Button, message, Checkbox, Select, Modal } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
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
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [modal, contextHolderModal] = Modal.useModal();
  const [editingId, setEditingId] = useState<number | null>(null);

  const [editingRequest, setEditingRequest] =
    useState<WareMappingRequest | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await wareMappingApi.searchWareMapping({
        wareTemplateId: templateId,
      });

      const typeOrder = ["CELL", "TEXT", "ROW"];
      const sorted = [...res].sort((a, b) => {
        const typeDiff =
          typeOrder.indexOf(a.fieldType ?? "") -
          typeOrder.indexOf(b.fieldType ?? "");
        if (typeDiff !== 0) return typeDiff;

        return (a.cellAddress ?? "").localeCompare(
          b.cellAddress ?? "",
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        );
      });

      setData(sorted);
    } catch (e) {
      messageApi.error("Lấy dữ liệu mapping thất bại");
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

  const FIELD_TYPE_LABEL: Record<string, string> = {
    ROW: "Đối chiếu cột",
    CELL: "Đối chiếu ô",
    TEXT: "Nhập dữ liệu",
  };

  const FIELD_VALUE_LABEL: Record<string, string> = {
    INTEGER: "Số nguyên",
    NUMBER: "Giá trị",
    STRING: "Chuỗi kí tự",
  };

  const handleAdd = () => {
    setEditingId(null);

    setEditingRequest({
      id: null,
      fieldTitle: "",
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
        fieldTitle: "",
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
      fieldTitle: record.fieldTitle,
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
        messageApi.warning("Field Name và Field Type là bắt buộc");
        return;
      }

      if (editingRequest.id == null) {
        await wareMappingApi.saveWareMapping(editingRequest);
        messageApi.success("Thêm mapping thành công");
      } else {
        await wareMappingApi.updateWareMapping(editingRequest);
        messageApi.success("Cập nhật mapping thành công");
      }

      setEditingId(null);
      setEditingRequest(null);
      fetchData();
    } catch (e) {
      messageApi.error("Lưu mapping thất bại");
    }
  };

  const handleDelete = async (id: number) => {
    modal.confirm({
      title: "Xác nhận xóa",
      icon: <ExclamationCircleOutlined />,
      content: "Bạn có chắc chắn muốn xóa template này?",
      okType: "danger",
      onOk: async () => {
        try {
          await wareMappingApi.deleteWareMapping(String(id));
          messageApi.success("Xóa mapping thành công");
          fetchData();
        } catch (e) {
          messageApi.error("Xóa mapping thất bại");
        }
      },
    });
  };

  /* ================= COLUMNS ================= */
  const columns: ColumnsType<WareMappingResponse> = [
    {
      title: "Tên dữ liệu",
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
      title: "Tên hiển thị",
      width: 150,
      render: (_, record) =>
        isEditing(record) ? (
          <Input
            value={editingRequest?.fieldTitle}
            onChange={(e) => updateRequest("fieldTitle", e.target.value)}
          />
        ) : (
          record.fieldTitle
        ),
    },
    {
      title: "Kiểu đối chiếu",
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
          FIELD_TYPE_LABEL[record.fieldType ?? ""]
        ),
    },
    {
      title: "Địa chỉ ô/cột",
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
      title: "Kiểu giá trị",
      width: 150,
      align: "center",
      render: (_, record) =>
        isEditing(record) ? (
          <Select
            value={editingRequest?.fieldValue}
            style={{ width: "100%" }}
            onChange={(v) => updateRequest("fieldValue", v)}
            options={[
              { value: "INTEGER", label: "Số nguyên" },
              { value: "NUMBER", label: "Giá trị" },
              { value: "STRING", label: "Chuỗi kí tự" },
            ]}
          />
        ) : (
          FIELD_VALUE_LABEL[record.fieldValue ?? ""] ?? record.fieldValue
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
      title: "Scope_Filter",
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
      title: "Thao tác",
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

            <Button
              type="link"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id!)}
              danger
            >
              Xóa
            </Button>
          </>
        ),
    },
  ];

  return (
    <div className="px-4 py-4" style={{ paddingTop: 16 }}>
      {contextHolderMessage}
      {contextHolderModal}
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

        <Button
          type="primary"
          className="bg-[#1a8649]! hover:bg-[#15703d]!"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Thêm mới
        </Button>
      </div>

      <div className="overflow-auto">
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
    </div>
  );
};
