import { useState, useEffect } from "react";
import { Table, Input, Button, Space, Modal, Form, message, Card, Tag } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { DepartmentResponse, PageResponse } from "../types/department";
import { departmentApi } from "../api/departmentApi";

const DepartmentCategoryPage = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentResponse | null>(
    null
  );
  const [form] = Form.useForm();
  const [modal, contextHolderModal] = Modal.useModal();
  const [messageApi, contextHolderMessage] = message.useMessage();

  const [search, setSearch] = useState("");
  const [pageResponse, setPageResponse] = useState<
    PageResponse<DepartmentResponse>
  >({
    page: 0,
    limit: 10,
    totalElements: 0,
    totalPages: 0,
    content: [],
  });

  const loadDepartments = async (keyword = search, page = 0, limit = 10) => {
    try {
      const res = await departmentApi.searchDepartment(keyword, page, limit);
      setPageResponse(res);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleEdit = (dept: DepartmentResponse) => {
    setEditingDept(dept);
    form.setFieldsValue({
      code: dept.code,
      name: dept.name,
      description: dept.description,
    });
    setModalVisible(true);
  };

  const handleDelete = (dept: DepartmentResponse) => {
    modal.confirm({
      title: `Xóa phòng ban ${dept.name}?`,
      content: "Hành động này không thể hoàn tác!",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await departmentApi.deleteDepartment(dept.id);
          messageApi.success("Xóa phòng ban thành công");
          await loadDepartments(search, pageResponse.page, pageResponse.limit);
        } catch (error) {
          console.log(error);
          messageApi.error("Xóa phòng ban thất bại");
        }
      },
    });
  };

  const handleAddNew = () => {
    setEditingDept(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const departmentRequest: DepartmentResponse = {
        id: editingDept?.id || null,
        code: values.code,
        name: values.name,
        description: values.description,
      };

      try {
        await departmentApi.saveDepartment(departmentRequest);
        messageApi.success(
          editingDept
            ? "Cập nhật phòng ban thành công"
            : "Tạo phòng ban thành công"
        );
        setModalVisible(false);
        await loadDepartments(search, 0, pageResponse.limit);
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
      title: "Mã phòng ban",
      dataIndex: "code",
      key: "code",
      align: "center" as const,
      render: (text: string) => (
        <div className="flex justify-center items-center gap-2 text-center">
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: "Tên phòng ban",
      dataIndex: "name",
      key: "name",
      width: "25%",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <TeamOutlined className="text-gray-400" />
          <span className="font-medium text-gray-800">{text}</span>
        </div>
      ),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: "45%",
      render: (text: string) => (
        <span className="text-gray-600">{text || "-"}</span>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: "15%",
      align: "center" as const,
      render: (_: any, record: DepartmentResponse) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="bg-green-600! hover:bg-green-700! text-white border-0 shadow-md"
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
      {contextHolderModal}
      {contextHolderMessage}

      {/* Header Section */}


      {/* Main Card */}
      <Card className="shadow-lg border-0 rounded-xl">
        {/* Search and Action Bar */}
        <div className="flex gap-3 mb-6">
          <Input
            placeholder="Tìm kiếm theo mã hoặc tên phòng ban..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPressEnter={() => loadDepartments(search, 0, pageResponse.limit)}
            size="large"
            className="flex-1"
            style={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={handleAddNew}
            className="bg-green-600! hover:bg-green-700! text-white border-0 shadow-md"
            style={{ borderRadius: "8px", minWidth: "140px" }}
          >
            Thêm mới
          </Button>
        </div>

        {/* Statistics Bar */}
        <div className="mb-4 p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TeamOutlined className="text-blue-500 text-xl" />
              <span className="font-medium text-gray-700">
                Tổng số phòng ban:
              </span>
              <Tag color="blue" className="font-bold text-base px-3 py-1">
                {pageResponse.totalElements}
              </Tag>
            </div>
            {search && (
              <div className="text-sm text-gray-600">
                Tìm thấy <span className="font-semibold">{pageResponse.content.length}</span> kết quả
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
              loadDepartments(search, page - 1, pageResponse.limit),
            showTotal: (total) => `Tổng ${total} phòng ban`,
            className: "mt-4",
          }}
          size="middle"
          scroll={{ x: "100%" }}
          className="modern-department-table"
          rowClassName="hover:bg-blue-50 transition-colors"
        />
      </Card>

      {/* Modal */}
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        okText={editingDept ? "Cập nhật" : "Thêm mới"}
        cancelText="Hủy"
        title={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${editingDept ? 'bg-blue-100' : 'bg-green-100'
              }`}>
              {editingDept ? (
                <EditOutlined className="text-blue-600 text-lg" />
              ) : (
                <PlusOutlined className="text-green-600 text-lg" />
              )}
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">
                {editingDept ? "Chỉnh sửa phòng ban" : "Tạo phòng ban mới"}
              </div>
              {editingDept && (
                <div className="text-sm text-gray-500">{editingDept.name}</div>
              )}
            </div>
          </div>
        }
        width={800}
        okButtonProps={{
          className: "bg-green-600! hover:bg-green-700! text-white border-0 h-10 px-6 text-base font-medium",
          size: "large",
        }}
        cancelButtonProps={{
          size: "large",
          className: "h-10 px-6 text-base"
        }}
      >
        <Form form={form} layout="vertical" className="mt-6">
          <Form.Item
            name="code"
            label={
              <span className="font-medium text-gray-700">
                Mã phòng ban <span className="text-red-500">*</span>
              </span>
            }
            rules={[
              { required: true, message: "Vui lòng nhập mã phòng ban" },
              { pattern: /^[A-Z0-9_-]+$/, message: "Mã phòng ban chỉ chứa chữ IN HOA, số, dấu gạch ngang và gạch dưới" }
            ]}
          >
            <Input
              placeholder="VD: DEPT_001, IT-DEPT"
              size="large"
              className="rounded-lg"
              style={{ textTransform: 'uppercase' }}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label={
              <span className="font-medium text-gray-700">
                Tên phòng ban <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true, message: "Vui lòng nhập tên phòng ban" }]}
          >
            <Input
              placeholder="VD: Phòng Công Nghệ Thông Tin"
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
              placeholder="Nhập mô tả chi tiết về phòng ban..."
              rows={4}
              size="large"
              className="rounded-lg"
            />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .modern-department-table .ant-table {
          font-size: 14px;
        }
        .modern-department-table .ant-table-thead > tr > th {
          background: linear-gradient(to right, #f8fafc, #f1f5f9);
          color: #1e293b;
          font-weight: 600;
          border-bottom: 2px solid #e2e8f0;
          padding: 16px;
        }
        .modern-department-table .ant-table-tbody > tr > td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .modern-department-table .ant-table-tbody > tr:hover > td {
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
        .ant-input, .ant-input-affix-wrapper {
          transition: all 0.3s ease;
        }
        .ant-input:focus, .ant-input-affix-wrapper:focus, .ant-input-affix-wrapper-focused {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        .bg-gradient-to-br {
          background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
        }
      `}</style>
    </div>
  );
};

export default DepartmentCategoryPage;