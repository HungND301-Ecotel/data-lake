import { useState, useEffect } from "react";
import { Table, Input, Button, Space, Modal, Form, message } from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
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
    { title: "Mã phòng", dataIndex: "code", key: "code", width: "15%" },
    { title: "Tên phòng", dataIndex: "name", key: "name", width: "20%" },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: "50%",
    },
    {
      title: "Thao tác",
      key: "actions",
      width: "15%",
      render: (_: any, record: DepartmentResponse) => (
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
    <div className="px-4 py-4" style={{ width: "100%" }}>
      {contextHolderModal}
      {contextHolderMessage}

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Input
          placeholder="Tìm kiếm phòng ban"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => loadDepartments(search, 0, pageResponse.limit)}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          className="bg-[#1677ff]! hover:bg-[#064481]!"
          icon={<PlusOutlined />}
          onClick={handleAddNew}
        >
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
            loadDepartments(search, page - 1, pageResponse.limit),
        }}
        size="middle"
        scroll={{ x: "100%" }}
      />

      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        okText={editingDept ? "Lưu" : "Tạo"}
        title={
          editingDept
            ? `Chỉnh sửa phòng ban: ${editingDept.name}`
            : "Tạo phòng ban"
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Mã phòng" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Tên phòng" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DepartmentCategoryPage;
