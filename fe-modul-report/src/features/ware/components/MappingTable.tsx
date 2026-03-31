import React, { useEffect, useState } from "react";
import { Table, Input, Button, message, Checkbox, Select, Modal, Card, Space, Tag, Tooltip, Upload, Spin, Alert } from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  RobotOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { WareMappingResponse, WareMappingRequest } from "../types/wareMapping";
import { wareMappingApi } from "../api/wareMappingApi";
import { useExcelMapping } from "../../../features/excel-mapping/hooks/useExcelMapping";

// ---- Field type union (phải khớp với WareMappingRequest) ----
type FieldType = "CELL" | "ROW" | "TEXT";

// ---- Build pending rows from AI response ----
function buildRequestsFromAiResponse(
  result: NonNullable<ReturnType<typeof useExcelMapping>["result"]>["result"],
  templateId: number
): WareMappingRequest[] {
  const requests: WareMappingRequest[] = [];

  const metaFields: { fieldName: string; fieldTitle: string; fieldValue: string }[] = [
    { fieldName: "BUKRS", fieldTitle: "Mã công ty", fieldValue: "STRING" },
    { fieldName: "DAY", fieldTitle: "Ngày", fieldValue: "INTEGER" },
    { fieldName: "PERIOD", fieldTitle: "Tháng", fieldValue: "INTEGER" },
    { fieldName: "YEAR", fieldTitle: "Năm", fieldValue: "INTEGER" },
  ];

  for (const meta of metaFields) {
    requests.push({
      id: null,
      fieldName: meta.fieldName,
      fieldTitle: meta.fieldTitle,
      fieldType: "CELL" as FieldType,
      cellAddress: "",
      fieldValue: meta.fieldValue,
      isKeyColumn: true,
      isScopFilter: true,
      wareTemplateId: templateId,
    });
  }

  for (const col of result.column_mapping) {
    requests.push({
      id: null,
      fieldName: col.mapped_key ?? "",
      fieldTitle: col.mapped_name ?? undefined,
      fieldType: "ROW" as FieldType,
      cellAddress: String(col.excel_column_index + 1),
      fieldValue: "",
      isKeyColumn: false,
      isScopFilter: false,
      wareTemplateId: templateId,
    });
  }

  return requests;
}

// ---- Component ----
export const MappingTable: React.FC<{ templateId: number }> = ({ templateId }) => {
  const [data, setData] = useState<WareMappingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [modal, contextHolderModal] = Modal.useModal();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingRequest, setEditingRequest] = useState<WareMappingRequest | null>(null);

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const { result: aiResult, loading: aiLoading, error: aiError, analyze, clear: clearAi } = useExcelMapping();
  const [pendingRows, setPendingRows] = useState<WareMappingRequest[]>([]);

  // ---- Fetch ----
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await wareMappingApi.searchWareMapping({ wareTemplateId: templateId });
      const typeOrder: FieldType[] = ["CELL", "TEXT", "ROW"];
      const sorted = [...res].sort((a, b) => {
        const typeDiff =
          typeOrder.indexOf(a.fieldType as FieldType) - typeOrder.indexOf(b.fieldType as FieldType);
        if (typeDiff !== 0) return typeDiff;
        return (a.cellAddress ?? "").localeCompare(b.cellAddress ?? "", undefined, {
          numeric: true,
          sensitivity: "base",
        });
      });
      setData(sorted);
    } catch {
      messageApi.error("Lấy dữ liệu mapping thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [templateId]);

  // Khi AI trả kết quả → build pending rows và inject vào table
  useEffect(() => {
    if (!aiResult?.result) return;

    const rows = buildRequestsFromAiResponse(aiResult.result, templateId);
    setPendingRows(rows);

    const previewRows: WareMappingResponse[] = rows.map((r) => ({
      id: null,
      fieldName: r.fieldName,
      fieldTitle: r.fieldTitle,
      fieldType: r.fieldType,
      cellAddress: r.cellAddress,
      fieldValue: r.fieldValue,
      isKeyColumn: r.isKeyColumn,
      isScopFilter: r.isScopFilter,
    }));

    setData((prev) => [...previewRows, ...prev.filter((r) => r.id !== null)]);
    setAiModalOpen(false);
    messageApi.success(`AI đã tạo ${rows.length} dòng mapping. Hãy kiểm tra và lưu từng dòng.`);
  }, [aiResult]);

  // ---- Display maps ----
  const FIELD_TYPE_LABEL: Record<FieldType, string> = {
    ROW: "Đối chiếu cột",
    CELL: "Đối chiếu ô",
    TEXT: "Nhập dữ liệu",
  };
  const FIELD_TYPE_COLOR: Record<FieldType, string> = {
    ROW: "blue",
    CELL: "cyan",
    TEXT: "green",
  };
  const FIELD_VALUE_LABEL: Record<string, string> = {
    INTEGER: "Số nguyên",
    NUMBER: "Giá trị",
    STRING: "Chuỗi kí tự",
  };
  const FIELD_TYPE_OPTIONS = [
    { value: "ROW" as FieldType, label: "Đối chiếu cột" },
    { value: "CELL" as FieldType, label: "Đối chiếu ô" },
    { value: "TEXT" as FieldType, label: "Nhập dữ liệu" },
  ];
  const FIELD_VALUE_OPTIONS = [
    { value: "INTEGER", label: "Số nguyên" },
    { value: "NUMBER", label: "Giá trị" },
    { value: "STRING", label: "Chuỗi kí tự" },
  ];

  // ---- Helpers ----
  const isNormalEditing = (record: WareMappingResponse) => {
    if (record.id === null && pendingRows.length === 0 && editingId === null && editingRequest !== null) {
      return true;
    }
    // Row đang sửa có id thật
    return record.id !== null && editingId === record.id;
  };

  const getPendingIndex = (record: WareMappingResponse): number => {
    if (record.id !== null) return -1;
    const nullRows = data.filter((r) => r.id === null);
    const idx = nullRows.indexOf(record);
    return idx < pendingRows.length ? idx : -1;
  };

  const updateRequest = <K extends keyof WareMappingRequest>(key: K, value: WareMappingRequest[K]) => {
    setEditingRequest((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const updatePendingRow = <K extends keyof WareMappingRequest>(
    index: number, key: K, value: WareMappingRequest[K]
  ) => {
    setPendingRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  // ---- Normal add / edit / save ----
  const handleAdd = () => {
    setEditingId(null);
    setEditingRequest({
      id: null, fieldTitle: "", fieldName: "", fieldType: "ROW",
      cellAddress: "", fieldValue: "",
      isKeyColumn: false, isScopFilter: false,
      wareTemplateId: templateId,
    });
    setData((prev) => [
      { id: null, fieldTitle: "", fieldName: "", fieldType: "ROW", cellAddress: "", fieldValue: "", isKeyColumn: false, isScopFilter: false },
      ...prev,
    ]);
  };

  const handleEdit = (record: WareMappingResponse) => {
    setEditingId(record.id!);
    setEditingRequest({
      id: record.id!, fieldTitle: record.fieldTitle, fieldName: record.fieldName,
      fieldType: record.fieldType as FieldType,
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
    if (!editingRequest.fieldName || !editingRequest.fieldType) {
      messageApi.warning("Field Name và Field Type là bắt buộc");
      return;
    }
    try {
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
    } catch {
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
        } catch {
          messageApi.error("Xóa mapping thất bại");
        }
      },
    });
  };

  // ---- Pending row save / cancel ----
  const handleSavePendingRow = async (rowIndex: number) => {
    const req = pendingRows[rowIndex];
    if (!req) return;
    if (!req.fieldName || !req.fieldType) {
      messageApi.warning("Field Name và Field Type là bắt buộc");
      return;
    }
    try {
      await wareMappingApi.saveWareMapping(req);
      messageApi.success(`Đã lưu: ${req.fieldName}`);

      const newPending = pendingRows.filter((_, i) => i !== rowIndex);
      setPendingRows(newPending);

      setData((prev) => {
        const nullIndices: number[] = [];
        prev.forEach((r, i) => { if (r.id === null) nullIndices.push(i); });
        const targetIdx = nullIndices[rowIndex];
        if (targetIdx === undefined) return prev;

        const updated = [...prev];
        updated.splice(targetIdx, 1);
        return updated;
      });

      if (newPending.length === 0) fetchData();

    } catch {
      messageApi.error("Lưu thất bại");
    }
  };

  const handleCancelPendingRow = (rowIndex: number) => {
    setPendingRows((prev) => prev.filter((_, i) => i !== rowIndex));
    setData((prev) => {
      const nullIndices: number[] = [];
      prev.forEach((r, i) => { if (r.id === null) nullIndices.push(i); });
      const targetIdx = nullIndices[rowIndex];
      return targetIdx !== undefined ? prev.filter((_, i) => i !== targetIdx) : prev;
    });
  };

  const handleOpenAiModal = () => {
    clearAi();
    setAiModalOpen(true);
  };

  // ---- Shared render helpers ----
  const renderInput = (value: string | undefined, onChange: (v: string) => void, placeholder?: string) => (
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} size="large" className="rounded-lg" />
  );

  // fieldType select — giá trị phải là FieldType
  const renderFieldTypeSelect = (
    value: FieldType | undefined,
    onChange: (v: FieldType) => void
  ) => (
    <Select<FieldType>
      value={value}
      style={{ width: "100%" }}
      onChange={onChange}
      options={FIELD_TYPE_OPTIONS}
      size="large"
    />
  );

  // fieldValue select — giá trị là string thường
  const renderFieldValueSelect = (
    value: string | undefined,
    onChange: (v: string) => void
  ) => (
    <Select<string>
      value={value || undefined}
      style={{ width: "100%" }}
      onChange={onChange}
      options={FIELD_VALUE_OPTIONS}
      size="large"
      placeholder="Chọn kiểu..."
    />
  );

  const renderCheckbox = (checked: boolean | undefined, onChange: (v: boolean) => void) => (
    <Checkbox checked={checked} onChange={(e) => onChange(e.target.checked)} />
  );

  // ---- Columns ----
  const columns: ColumnsType<WareMappingResponse> = [
    {
      title: "Tên dữ liệu", width: 150,
      render: (_, record) => {
        const pi = getPendingIndex(record);
        if (pi >= 0) return renderInput(pendingRows[pi]?.fieldName, (v) => updatePendingRow(pi, "fieldName", v), "Nhập tên dữ liệu");
        if (isNormalEditing(record)) return renderInput(editingRequest?.fieldName, (v) => updateRequest("fieldName", v), "Nhập tên dữ liệu");
        return <span className="font-medium text-gray-800">{record.fieldName}</span>;
      },
    },
    {
      title: "Tên hiển thị", width: 150,
      render: (_, record) => {
        const pi = getPendingIndex(record);
        if (pi >= 0) return renderInput(pendingRows[pi]?.fieldTitle, (v) => updatePendingRow(pi, "fieldTitle", v), "Nhập tên hiển thị");
        if (isNormalEditing(record)) return renderInput(editingRequest?.fieldTitle, (v) => updateRequest("fieldTitle", v), "Nhập tên hiển thị");
        return <span className="text-gray-700">{record.fieldTitle}</span>;
      },
    },
    {
      title: "Kiểu đối chiếu", width: 140, align: "center",
      render: (_, record) => {
        const pi = getPendingIndex(record);
        if (pi >= 0) return renderFieldTypeSelect(
          pendingRows[pi]?.fieldType as FieldType,
          (v) => updatePendingRow(pi, "fieldType", v)
        );
        if (isNormalEditing(record)) return renderFieldTypeSelect(
          editingRequest?.fieldType as FieldType,
          (v) => updateRequest("fieldType", v)
        );
        return (
          <Tag color={FIELD_TYPE_COLOR[record.fieldType as FieldType]}>
            {FIELD_TYPE_LABEL[record.fieldType as FieldType]}
          </Tag>
        );
      },
    },
    {
      title: "Địa chỉ ô/cột", width: 140, align: "center",
      render: (_, record) => {
        const pi = getPendingIndex(record);
        if (pi >= 0) return renderInput(pendingRows[pi]?.cellAddress, (v) => updatePendingRow(pi, "cellAddress", v), "VD: A1, B2");
        if (isNormalEditing(record)) return renderInput(editingRequest?.cellAddress, (v) => updateRequest("cellAddress", v), "VD: A1, B2");
        return <Tag color="default" className="px-3 py-1 font-mono">{record.cellAddress || "-"}</Tag>;
      },
    },
    {
      title: "Kiểu giá trị", width: 150, align: "center",
      render: (_, record) => {
        const pi = getPendingIndex(record);
        if (pi >= 0) return renderFieldValueSelect(pendingRows[pi]?.fieldValue, (v) => updatePendingRow(pi, "fieldValue", v));
        if (isNormalEditing(record)) return renderFieldValueSelect(editingRequest?.fieldValue, (v) => updateRequest("fieldValue", v));
        return <Tag>{FIELD_VALUE_LABEL[record.fieldValue ?? ""] ?? record.fieldValue}</Tag>;
      },
    },
    {
      title: "Key", width: 80, align: "center",
      render: (_, record) => {
        const pi = getPendingIndex(record);
        if (pi >= 0) return renderCheckbox(pendingRows[pi]?.isKeyColumn, (v) => updatePendingRow(pi, "isKeyColumn", v));
        if (isNormalEditing(record)) return renderCheckbox(editingRequest?.isKeyColumn, (v) => updateRequest("isKeyColumn", v));
        return record.isKeyColumn
          ? <Tag icon={<EditOutlined />} color="success">Key</Tag>
          : <span className="text-gray-400">-</span>;
      },
    },
    {
      title: "Scope_Filter", width: 120, align: "center",
      render: (_, record) => {
        const pi = getPendingIndex(record);
        if (pi >= 0) return renderCheckbox(pendingRows[pi]?.isScopFilter, (v) => updatePendingRow(pi, "isScopFilter", v));
        if (isNormalEditing(record)) return renderCheckbox(editingRequest?.isScopFilter, (v) => updateRequest("isScopFilter", v));
        return record.isScopFilter
          ? <Tag color="warning">Filter</Tag>
          : <span className="text-gray-400">-</span>;
      },
    },
    {
      title: "Thao tác", width: 180, align: "center",
      render: (_, record) => {
        const pi = getPendingIndex(record);

        if (pi >= 0) {
          return (
            <Space>
              <Tooltip title="Lưu dòng này">
                <Button type="primary" icon={<SaveOutlined />} onClick={() => handleSavePendingRow(pi)} className="bg-green-600! hover:bg-green-700!" size="large">Lưu</Button>
              </Tooltip>
              <Tooltip title="Bỏ dòng này">
                <Button icon={<CloseOutlined />} onClick={() => handleCancelPendingRow(pi)} size="large">Bỏ</Button>
              </Tooltip>
            </Space>
          );
        }

        if (isNormalEditing(record)) {
          return (
            <Space>
              <Tooltip title="Lưu thay đổi">
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} className="bg-green-600! hover:bg-green-700!" size="large">Lưu</Button>
              </Tooltip>
              <Tooltip title="Hủy thay đổi">
                <Button icon={<CloseOutlined />} onClick={handleCancel} size="large">Hủy</Button>
              </Tooltip>
            </Space>
          );
        }

        return (
          <Space>
            <Tooltip title="Chỉnh sửa mapping">
              <Button type="primary" icon={<EditOutlined />} onClick={() => handleEdit(record)} className="bg-green-600! hover:bg-green-700!" size="large">Sửa</Button>
            </Tooltip>
            <Tooltip title="Xóa mapping">
              <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id!)} size="large">Xóa</Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="px-6 py-6 bg-linear-to-br from-gray-50 to-gray-100 min-h-screen">
      {contextHolderMessage}
      {contextHolderModal}

      {/* AI Upload Modal */}
      <Modal
        title={
          <span className="flex items-center gap-2">
            <RobotOutlined className="text-purple-500" />
            Cấu hình AI từ file Excel
          </span>
        }
        open={aiModalOpen}
        onCancel={() => setAiModalOpen(false)}
        footer={null}
        width={520}
        destroyOnClose
      >
        {aiError && <Alert message={aiError} type="error" closable className="mb-4" />}

        <Upload.Dragger
          accept=".xlsx,.xls,.csv"
          maxCount={1}
          showUploadList={false}
          beforeUpload={(file) => { analyze(file); return false; }}
          disabled={aiLoading}
          className="rounded-xl"
        >
          {aiLoading ? (
            <div className="py-10">
              <Spin size="large" />
              <p className="mt-4 text-gray-500">Đang phân tích cấu trúc file...</p>
            </div>
          ) : (
            <div className="py-10">
              <FileExcelOutlined className="text-5xl text-green-400" />
              <p className="mt-4 text-gray-600 text-base">Kéo thả file Excel/CSV hoặc click để chọn</p>
              <p className="text-gray-400 text-sm">Hỗ trợ .xlsx, .xls, .csv</p>
            </div>
          )}
        </Upload.Dragger>

        <p className="mt-4 text-gray-500 text-sm">
          AI sẽ tự động phân tích cấu trúc file và tạo các dòng mapping tương ứng.
          Bạn có thể kiểm tra và điều chỉnh từng dòng trước khi lưu.
        </p>
      </Modal>

      <Card className="shadow-sm border-0 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100">
              <DatabaseOutlined className="text-purple-600 text-lg" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 m-0">Cấu hình dữ liệu Mapping</h1>
          </div>

          <Space>
            <Tooltip title="Dùng AI đọc file Excel để tự động tạo mapping">
              <Button
                size="large"
                icon={<RobotOutlined />}
                onClick={handleOpenAiModal}
                style={{ borderColor: "#a855f7", color: "#9333ea" }}
                className="h-10 px-5"
              >
                Cấu hình AI
              </Button>
            </Tooltip>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleAdd}
              className="bg-green-600! hover:bg-green-700! h-10 px-6"
            >
              Thêm mới
            </Button>
          </Space>
        </div>

        {pendingRows.length > 0 && (
          <Alert
            message={
              <span>
                <RobotOutlined className="mr-2 text-purple-500" />
                AI đã tạo <strong>{pendingRows.length}</strong> dòng mapping đang chờ xác nhận.
                Hãy kiểm tra từng dòng và nhấn <strong>Lưu</strong> hoặc <strong>Bỏ</strong>.
              </span>
            }
            type="info"
            className="mb-4 rounded-lg"
            showIcon={false}
          />
        )}

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <Table
            rowKey={(record) =>
              record.id != null
                ? String(record.id)
                : `pending-${data.filter((r) => r.id === null).indexOf(record)}`
            }
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={false}
            bordered
            size="middle"
            rowClassName={(record, index) => {
              const pi = getPendingIndex(record);
              if (pi >= 0) return "bg-purple-50 hover:bg-purple-100 transition-colors";
              if (isNormalEditing(record)) return "bg-blue-50 hover:bg-blue-100 transition-colors";
              return index % 2 === 0
                ? "bg-white hover:bg-gray-50 transition-colors"
                : "bg-gray-50 hover:bg-gray-100 transition-colors";
            }}
            scroll={{ x: 1200 }}
          />
        </div>

        {data.length === 0 && !loading && (
          <div className="text-center py-16 bg-gray-50 rounded-lg mt-4">
            <DatabaseOutlined className="text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500 text-lg mb-6">Không có dữ liệu mapping</p>
            <Space>
              <Button size="large" icon={<RobotOutlined />} onClick={handleOpenAiModal} style={{ borderColor: "#a855f7", color: "#9333ea" }} className="h-11 px-8">
                Cấu hình AI
              </Button>
              <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleAdd} className="bg-green-600! hover:bg-green-700! h-11 px-8">
                Thêm mapping mới
              </Button>
            </Space>
          </div>
        )}
      </Card>

      <style>{`
        .bg-linear-to-br { background: linear-gradient(to bottom right, #f9fafb, #f3f4f6); }
        .ant-table-cell { padding: 12px !important; }
        .ant-table-header .ant-table-cell { background: linear-gradient(to right, #f3f4f6, #e5e7eb); font-weight: 600; color: #374151; }
        .ant-table-row { transition: all 0.2s ease; }
        .ant-table-row:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
        .ant-input:focus, .ant-input-affix-wrapper:focus, .ant-input-affix-wrapper-focused { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
        .ant-select-focused .ant-select-selector { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1); }
      `}</style>
    </div>
  );
};