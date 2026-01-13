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
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
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
    depId = departmentId
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
      okType: "danger",
      onOk: async () => {
        await wareCategoryApi.deleteWareCategory(String(record.id));
        messageApi.success("Xóa thành công");
        loadData(search, pageResponse.page);
      },
    });
  };

  const handleSave = async () => {
    const values = await form.validateFields();

    const req: WareCategoryRequest = {
      id: editing?.id,
      ...values,
    };

    await wareCategoryApi.updateWareCategory(req);
    messageApi.success(editing ? "Cập nhật thành công" : "Tạo thành công");

    setModalVisible(false);
    loadData(search, 0);
  };

  const handleAddNew = async () => {
    const values = await form.validateFields();

    const req: WareCategoryRequest = {
      id: null,
      ...values,
    };

    await wareCategoryApi.saveWareCategory(req);
    messageApi.success(editing ? "Cập nhật thành công" : "Tạo thành công");

    setModalVisible(false);
    loadData(search, 0);
  };

  const columns = [
    { title: "Mã", dataIndex: "code", width: "15%" },
    { title: "Tên", dataIndex: "name", width: "25%" },
    {
      title: "Phòng ban",
      dataIndex: "departmentName",
      width: "25%",
    },
    { title: "Mô tả", dataIndex: "description", width: "20%" },
    {
      title: "Thao tác",
      width: "15%",
      render: (_: any, record: WareCategoryResponse) => (
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
    <div className="px-4 py-4 min-h-screen">
      {contextHolder}
      {contextHolderModal}

      {/* SEARCH */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Input
          placeholder="Tìm kiếm danh mục"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onPressEnter={() => loadData(search, 0)}
        />

        <Select
          allowClear
          placeholder="Phòng ban"
          style={{ width: 200 }}
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
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          className="bg-[#1a8649]! hover:bg-[#15703d]!"
        >
          Thêm mới
        </Button>
      </div>

      {/* TABLE */}
      <div className="overflow-auto">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={pageResponse.content}
          pagination={{
            current: pageResponse.page + 1,
            pageSize: pageResponse.limit,
            total: pageResponse.totalElements,
            onChange: (p) => loadData(search, p - 1),
          }}
        />
      </div>

      {/* MODAL */}
      <Modal
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={editing ? handleSave : handleAddNew}
        title={editing ? "Cập nhật danh mục" : "Tạo danh mục"}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="departmentId"
            label="Phòng ban"
            rules={[{ required: true }]}
          >
            <Select
              options={departments.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
            />
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
        </Form>
      </Modal>
    </div>
  );
};

export default WareCategoryPage;
