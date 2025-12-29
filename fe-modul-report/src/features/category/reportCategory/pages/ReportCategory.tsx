import { useState, useEffect } from "react";
import {
  Table,
  Input,
  Button,
  Space,
  Modal,
  Form,
  message,
  Select,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { DepartmentResponse, PageResponse } from "../../../department/types/department";
import type {
  ReportCategoryRequest,
  ReportCategoryResponse,
  ReportCategorySearch,
} from "../../../report/types/report";
import { reportCategoryApi } from "../api/reportCategoryApi";
import { departmentApi } from "../../../department/api/departmentApi";

const ReportCategoryPage = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<ReportCategoryResponse | null>(null);
  const [form] = Form.useForm();
  const [modal, contextHolderModal] = Modal.useModal();
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);

  const [search, setSearch] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState<string | null>(
    null
  );
  const [pageResponse, setPageResponse] = useState<
    PageResponse<ReportCategoryResponse>
  >({
    page: 0,
    limit: 10,
    totalElements: 0,
    totalPages: 0,
    content: [],
  });

  const loadCategories = async (
    keyword = search,
    page = 0,
    limit = 10,
    departmentId: string | null = filterDepartmentId
  ) => {
    try {
      const res = await reportCategoryApi.searchReportCategory({
        keyword,
        page,
        limit,
        sort: "ASC",
        sortBy: "department",
        departmentId,
      } as ReportCategorySearch);
      setPageResponse(res);
    } catch (err) {
      console.log(err);
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await departmentApi.searchDepartment("", 0, 200);
      setDepartments(res.content);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadCategories();
    loadDepartments();
  }, []);

  const handleEdit = (category: ReportCategoryResponse) => {
    setEditingCategory(category);
    form.setFieldsValue({
      code: category.code,
      name: category.name,
      description: category.description,
      departmentId: category.departmentId, // id của phòng ban
    });
    setModalVisible(true);
  };

  const handleDelete = (category: ReportCategoryResponse) => {
    modal.confirm({
      title: `Xóa danh mục ${category.name}?`,
      content: "Hành động này không thể hoàn tác!",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await reportCategoryApi.deleteReportCategory(category.id);
          messageApi.success("Xóa danh mục thành công");
          await loadCategories(
            search,
            pageResponse.page,
            pageResponse.limit,
            filterDepartmentId
          );
        } catch (error) {
          console.log(error);
          messageApi.error("Xóa danh mục thất bại");
        }
      },
    });
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const request: ReportCategoryRequest = {
        id: editingCategory?.id || null,
        code: values.code,
        name: values.name,
        description: values.description,
        departmentId: values.departmentId,
      };

      await reportCategoryApi.saveReportCategory(request);
      messageApi.success(
        editingCategory
          ? "Cập nhật danh mục thành công"
          : "Tạo danh mục thành công"
      );
      setModalVisible(false);
      loadCategories(search, 0, pageResponse.limit, filterDepartmentId);
    } catch (error: any) {
      const msg = error.response?.data?.message;
      messageApi.error(msg || "Lỗi hệ thống");
    }
  };

  const columns = [
    { title: "Mã danh mục", dataIndex: "code", key: "code", width: "15%" },
    { title: "Tên danh mục", dataIndex: "name", key: "name", width: "25%" },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: "35%",
    },
    {
      title: "Phòng ban",
      dataIndex: "departmentName",
      key: "departmentName",
      width: "15%",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: "10%",
      render: (_: any, record: ReportCategoryResponse) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>
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
    <div style={{ width: "100%" }}>
      {contextHolderModal}
      {contextHolderMessage}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Input
          placeholder="Tìm kiếm danh mục"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() =>
            loadCategories(search, 0, pageResponse.limit, filterDepartmentId)
          }
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Chọn phòng ban"
          allowClear
          style={{ width: 200 }}
          value={filterDepartmentId}
          onChange={(value) => {
            const deptId = value || null;
            setFilterDepartmentId(deptId);
            loadCategories(search, 0, pageResponse.limit, deptId);
          }}
          onBlur={() =>
            loadCategories(search, 0, pageResponse.limit, filterDepartmentId)
          }
        >
          {departments.map((dept) => (
            <Select.Option key={dept.id} value={dept.id}>
              {dept.name}
            </Select.Option>
          ))}
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddNew}>
          Thêm mới
        </Button>
      </div>

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
            loadCategories(
              search,
              page - 1,
              pageResponse.limit,
              filterDepartmentId
            ),
        }}
        size="middle"
        scroll={{ x: "100%" }}
      />

      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        okText={editingCategory ? "Lưu" : "Tạo"}
        title={
          editingCategory
            ? `Chỉnh sửa: ${editingCategory.name}`
            : "Tạo danh mục"
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="Mã danh mục"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input />
          </Form.Item>
          <Form.Item
            name="departmentId"
            label="Phòng ban"
            rules={[{ required: true }]}
          >
            <Select
              showSearch
              placeholder="Chọn phòng ban"
              optionFilterProp="children"
              filterOption={(input, option) =>
                String(option?.children)
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {departments.map((dept) => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReportCategoryPage;
