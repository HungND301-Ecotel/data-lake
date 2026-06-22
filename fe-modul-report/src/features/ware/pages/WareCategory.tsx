import { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Modal,
  Form,
  message,
  Select,
  Card,
  Tag,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  TeamOutlined,
} from "@ant-design/icons";

import type {
  WareCategoryResponse,
  WareCategoryRequest,
} from "../types/wareCategory";
import type { PageResponse } from "../../department/types/department";
import type { DepartmentResponse } from "../../department/types/department";

import { wareCategoryApi } from "../api/wareCategoryApi";
import { departmentApi } from "../../department/api/departmentApi";

const WareCategoryPage = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<WareCategoryResponse | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, contextHolderModal] = Modal.useModal();
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState<string | null>(null);

  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);

  const [pageResponse, setPageResponse] = useState<
    PageResponse<WareCategoryResponse>
  >({
    page: 0,
    limit: 10,
    totalElements: 0,
    totalPages: 0,
    content: [],
  });

  const loadDepartments = async () => {
    const res = await departmentApi.searchDepartment("", 0, 1000);
    setDepartments(res.content);
  };

  const loadData = async (
    keyword = search,
    page = 0,
    limit = pageResponse.limit,
    depId = departmentId,
  ) => {
    try {
      const res = await wareCategoryApi.searchWareCategory({
        keyword,
        page,
        limit,
        departmentId: depId,
      });
      setPageResponse(res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDepartments();
    loadData();
  }, []);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record: WareCategoryResponse) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (record: WareCategoryResponse) => {
    modal.confirm({
      title: `Xóa danh mục "${record.name}"?`,
      content: "Hành động này không thể hoàn tác!",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await wareCategoryApi.deleteWareCategory(String(record.id));
          messageApi.success("Xóa danh mục thành công");
          await loadData(search, pageResponse.page);
        } catch (error) {
          console.log(error);
          messageApi.error("Xóa danh mục thất bại");
        }
      },
    });
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const req: WareCategoryRequest = {
        id: editing?.id,
        ...values,
      };

      try {
        await wareCategoryApi.updateWareCategory(req);
        messageApi.success(
          editing ? "Cập nhật danh mục thành công" : "Tạo danh mục thành công",
        );
        setModalVisible(false);
        await loadData(search, 0);
      } catch (error: any) {
        const msg = error.response?.data?.message;
        messageApi.error(msg || "Lỗi hệ thống");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddNew = async () => {
    try {
      const values = await form.validateFields();
      const req: WareCategoryRequest = {
        id: null,
        ...values,
      };

      try {
        await wareCategoryApi.saveWareCategory(req);
        messageApi.success("Tạo danh mục thành công");
        setModalVisible(false);
        await loadData(search, 0);
      } catch (error: any) {
        const msg = error.response?.data?.message;
        messageApi.error(msg || "Lỗi hệ thống");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const columns = [
    {
      title: "Mã danh mục",
      dataIndex: "code",
      align: "center" as const,
      key: "code",
      width: "15%",
      render: (text: string) => (
        <div className="flex justify-center items-center gap-2 text-center">
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: "Tên danh mục",
      dataIndex: "name",
      key: "name",
      width: "25%",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <AppstoreOutlined className="text-gray-400" />
          <span className="font-medium text-gray-800">{text}</span>
        </div>
      ),
    },
    {
      title: "Phòng ban",
      dataIndex: "departmentName",
      key: "departmentName",
      width: "20%",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <TeamOutlined className="text-blue-500" />
          <span className="text-gray-700">{text}</span>
        </div>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: "25%",
      render: (text: string) => (
        <span className="text-gray-600">{text || "-"}</span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: "15%",
      align: "center" as const,
      render: (_: any, record: WareCategoryResponse) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="bg-[#39b6f9]! hover:bg-blue-700! text-white! border-0"
          >
            Sửa
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="px-6 py-6 min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {contextHolder}
      {contextHolderModal}

      {/* Main Card */}
      <Card className="shadow-lg border-0 rounded-xl">
        <div className="font-semibold mb-2 text-lg text-blue-600">/ Danh mục báo cáo</div>
        {/* Search and Action Bar */}
        <div className="flex gap-3 mb-6">
          <Input
            placeholder="Tìm kiếm theo mã hoặc tên danh mục..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => loadData(search, 0)}
            size="large"
            className="flex-1"
            style={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />

          <Select
            allowClear
            placeholder="Lọc theo phòng ban"
            size="large"
            style={{ width: 240, borderRadius: "8px" }}
            value={departmentId}
            onChange={(value) => {
              setDepartmentId(value);
              loadData(search, 0, pageResponse.limit, value);
            }}
            options={departments.map((d) => ({
              value: d.id,
              label: d.name,
            }))}
          />

          <Button
            size="large"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            className="bg-[#39b6f9]! hover:bg-blue-700! text-white! border-0 shadow-md"
            style={{ borderRadius: "8px", minWidth: "140px" }}
          >
            Thêm mới
          </Button>
        </div>

        {/* Statistics Bar */}
        <div className="mb-4 p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppstoreOutlined className="text-blue-500 text-xl" />
              <span className="font-medium text-gray-700">
                Tổng số danh mục:
              </span>
              <Tag color="blue" className="font-bold text-base px-3 py-1">
                {pageResponse.totalElements}
              </Tag>
            </div>
            {(search || departmentId) && (
              <div className="text-sm text-gray-600">
                Tìm thấy{" "}
                <span className="font-semibold">
                  {pageResponse.content.length}
                </span>{" "}
                kết quả
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <Table
          dataSource={pageResponse.content}
          columns={columns}
          rowKey="id"
          pagination={{
            current: pageResponse.page + 1,
            pageSize: pageResponse.limit,
            total: pageResponse.totalElements,
            showSizeChanger: false,
            onChange: (page) =>
              loadData(search, page - 1, pageResponse.limit, departmentId),
            showTotal: (total) => `Tổng ${total} danh mục`,
            className: "mt-4",
          }}
          size="middle"
          scroll={{ x: "100%" }}
          className="modern-ware-table"
          rowClassName="hover:bg-blue-50 transition-colors"
        />
      </Card>

      {/* Modal */}
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={editing ? handleSave : handleAddNew}
        okText={editing ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        title={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${editing ? 'bg-blue-100' : 'bg-green-100'
              }`}>
              {editing ? (
                <EditOutlined className="text-blue-600 text-lg" />
              ) : (
                <PlusOutlined className="text-[#39b6f9]! text-lg" />
              )}
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">
                {editing ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
              </div>
              {editing && (
                <div className="text-sm text-gray-500">{editing.name}</div>
              )}
            </div>
          </div>
        }
        width={800}
        okButtonProps={{
          className: "bg-[#39b6f9]! hover:bg-blue-700! text-white border-0 h-10 px-6 text-base font-medium",
          size: "large",
        }}
        cancelButtonProps={{
          size: "large",
          className: "h-10 px-6 text-base"
        }}
      >
        <Form form={form} layout="vertical" className="mt-6">
          <Form.Item
            name="departmentId"
            label={
              <span className="font-medium text-gray-700">
                Phòng ban <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true, message: "Vui lòng chọn phòng ban" }]}
          >
            <Select
              placeholder="Chọn phòng ban"
              size="large"
              className="rounded-lg"
              options={departments.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label={
              <span className="font-medium text-gray-700">
                Tên danh mục <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
          >
            <Input
              placeholder="VD: Văn phòng phẩm, Thiết bị điện tử"
              size="large"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span className="font-medium text-gray-700">Mô tả</span>
            }
          >
            <Input.TextArea
              placeholder="Nhập mô tả chi tiết về danh mục..."
              rows={4}
              size="large"
              className="rounded-lg"
            />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .modern-ware-table .ant-table {
          font-size: 14px;
        }
        .modern-ware-table .ant-table-thead > tr > th {
          background: linear-gradient(to right, #f8fafc, #f1f5f9);
          color: #1e293b;
          font-weight: 600;
          border-bottom: 2px solid #e2e8f0;
          padding: 16px;
        }
        .modern-ware-table .ant-table-tbody > tr > td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .modern-ware-table .ant-table-tbody > tr:hover > td {
          background: #eff6ff !important;
        }
        .ant-card {
          border-radius: 16px;
        }
        .ant-modal-header {
          border-radius: 12px 12px 0 0;
          padding: 20px 24px;
        }
        .ant-modal-content {
          border-radius: 12px;
        }
        .ant-input, .ant-input-affix-wrapper, .ant-select .ant-select-selector {
          transition: all 0.3s ease;
        }
        .ant-input:focus, .ant-input-affix-wrapper:focus, .ant-input-affix-wrapper-focused {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        .ant-select-focused .ant-select-selector {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }
        .bg-gradient-to-br {
          background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
        }
        .bg-gradient-to-r {
          background: linear-gradient(to right, #eff6ff, #eef2ff);
        }
      `}</style>
    </div>
  );
};

export default WareCategoryPage;
