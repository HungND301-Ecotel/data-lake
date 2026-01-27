import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  message,
  Checkbox,
  Select,
  Modal,
  Card,
  Space,
  Tag,
  Tooltip,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
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
          },
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
    value: WareMappingRequest[K],
  ) => {
    setEditingRequest((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const FIELD_TYPE_LABEL: Record<string, string> = {
    ROW: "Đối chiếu cột",
    CELL: "Đối chiếu ô",
    TEXT: "Nhập dữ liệu",
  };

  const FIELD_TYPE_COLOR: Record<string, string> = {
    ROW: "blue",
    CELL: "cyan",
    TEXT: "blue",
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
      content: "Bạn có chắc chắn muốn xóa mapping này?",
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
            placeholder="Nhập tên dữ liệu"
            size="large"
            className="rounded-lg"
          />
        ) : (
          <span className="font-medium text-gray-800">{record.fieldName}</span>
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
            placeholder="Nhập tên hiển thị"
            size="large"
            className="rounded-lg"
          />
        ) : (
          <span className="text-gray-700">{record.fieldTitle}</span>
        ),
    },
    {
      title: "Kiểu đối chiếu",
      width: 140,
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
            size="large"
          />
        ) : (
          <Tag color={FIELD_TYPE_COLOR[record.fieldType ?? ""]}>
            {FIELD_TYPE_LABEL[record.fieldType ?? ""]}
          </Tag>
        ),
    },
    {
      title: "Địa chỉ ô/cột",
      width: 140,
      align: "center",
      render: (_, record) =>
        isEditing(record) ? (
          <Input
            value={editingRequest?.cellAddress}
            onChange={(e) => updateRequest("cellAddress", e.target.value)}
            placeholder="VD: A1, B2"
            size="large"
            className="rounded-lg"
          />
        ) : (
          <Tag color="default" className="px-3 py-1 font-mono">
            {record.cellAddress || "-"}
          </Tag>
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
            size="large"
          />
        ) : (
          <Tag>
            {FIELD_VALUE_LABEL[record.fieldValue ?? ""] ?? record.fieldValue}
          </Tag>
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
          <Tag icon={<EditOutlined />} color="success">
            Key
          </Tag>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: "Scope_Filter",
      width: 120,
      align: "center",
      render: (_, record) =>
        isEditing(record) ? (
          <Checkbox
            checked={editingRequest?.isScopFilter}
            onChange={(e) => updateRequest("isScopFilter", e.target.checked)}
          />
        ) : record.isScopFilter ? (
          <Tag color="warning">Filter</Tag>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: "Thao tác",
      width: 180,
      align: "center",
      render: (_, record) =>
        isEditing(record) ? (
          <Space>
            <Tooltip title="Lưu thay đổi">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                className="bg-[#1976D2]! hover:bg-blue-700!"
                size="large"
              >
                Lưu
              </Button>
            </Tooltip>
            <Tooltip title="Hủy thay đổi">
              <Button
                icon={<CloseOutlined />}
                onClick={handleCancel}
                size="large"
              >
                Hủy
              </Button>
            </Tooltip>
          </Space>
        ) : (
          <Space>
            <Tooltip title="Chỉnh sửa mapping">
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                className="bg-[#1976D2]! hover:bg-blue-700!"
                size="large"
              >
                Sửa
              </Button>
            </Tooltip>

            <Tooltip title="Xóa mapping">
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDelete(record.id!)}
                size="large"
              >
                Xóa
              </Button>
            </Tooltip>
          </Space>
        ),
    },
  ];

  return (
    <div className="px-6 py-6 bg-linear-to-br from-gray-50 to-gray-100 min-h-screen">
      {contextHolderMessage}
      {contextHolderModal}

      <Card className="shadow-sm border-0 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100">
              <DatabaseOutlined className="text-purple-600 text-lg" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 m-0">
              Cấu hình dữ liệu Mapping
            </h1>
          </div>

          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            className="bg-[#1976D2]! hover:bg-blue-700! h-10 px-6"
          >
            Thêm mới
          </Button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <Table
            rowKey={(record) => record.id ?? "new"}
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={false}
            bordered
            size="middle"
            rowClassName={(record, index) =>
              isEditing(record)
                ? "bg-blue-50 hover:bg-blue-100 transition-colors"
                : index % 2 === 0
                  ? "bg-white hover:bg-gray-50 transition-colors"
                  : "bg-gray-50 hover:bg-gray-100 transition-colors"
            }
            scroll={{ x: 1200 }}
          />
        </div>

        {data.length === 0 && !loading && (
          <div className="text-center py-16 bg-gray-50 rounded-lg mt-4">
            <DatabaseOutlined className="text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500 text-lg mb-6">
              Không có dữ liệu mapping
            </p>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              className="bg-[#1976D2]! hover:bg-blue-700! h-11 px-8"
            >
              Thêm mapping mới
            </Button>
          </div>
        )}
      </Card>

      <style>{`
        .bg-linear-to-br {
          background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
        }
        .ant-table-cell {
          padding: 12px !important;
        }
        .ant-table-header .ant-table-cell {
          background: linear-gradient(to right, #f3f4f6, #e5e7eb);
          font-weight: 600;
          color: #374151;
        }
        .ant-table-row {
          transition: all 0.2s ease;
        }
        .ant-table-row:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .ant-input:focus,
        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        .ant-select-focused .ant-select-selector {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
};
