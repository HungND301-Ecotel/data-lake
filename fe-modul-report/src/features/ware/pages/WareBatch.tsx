import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Upload,
  message,
  Space,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import type { ColumnsType } from "antd/es/table";
import type {
  WareBatchRequest,
  WareBatchResponse,
  WareBatchSearch,
} from "../types/wareBacth";
import type { PageResponse } from "../../department/types/department";
import { wareBatchApi } from "../api/wareBathApi";
import { useNavigate, useParams } from "react-router-dom";

const { Search } = Input;

export const WareBatch: React.FC = () => {
  const [batches, setBatches] = useState<WareBatchResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm<WareBatchRequest>();
  const { templateId } = useParams<{ templateId: string }>();
  const nav = useNavigate();

  // ------------------ Fetch batch list ------------------
  const fetchBatches = async () => {
    setLoading(true);
    try {
      const params: WareBatchSearch = {
        page,
        limit,
        keyword: searchKeyword,
        wareTemplateId: templateId ? Number(templateId) : undefined,
      };
      const res: PageResponse<WareBatchResponse> =
        await wareBatchApi.searchWareBatch(params);
      setBatches(res.content);
      setTotal(res.totalElements);
    } catch (error) {
      message.error("Lấy danh sách batch thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [page, searchKeyword]);

  const handleAddBatch = async (values: WareBatchRequest) => {
    try {
      const request: WareBatchRequest = {
        ...values,
        id: null,
        wareTemplateId: templateId ? Number(templateId) : null,
        file: fileList[0]?.originFileObj || null,
      };

      await wareBatchApi.saveWareBatch(request);
      message.success("Thêm batch thành công");
      setIsModalOpen(false);
      setFileList([]);
      form.resetFields();
      fetchBatches();
    } catch (error) {
      console.error(error);
      message.error("Thêm batch thất bại");
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      await wareBatchApi.deleteWareBatch(String(id));
      message.success("Xóa batch thành công");
      fetchBatches();
    } catch (error) {
      message.error("Xóa batch thất bại");
    }
  };

  // ------------------ Table columns ------------------
  const columns: ColumnsType<WareBatchResponse> = [
    { title: "Code", dataIndex: "code", key: "code" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Description", dataIndex: "description", key: "description" },
    { title: "Employee", dataIndex: "employeeName", key: "employeeName" },
    { title: "Created At", dataIndex: "createdAt", key: "createdAt" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button onClick={() => nav(`/ware/batch/${record.id}`)}>Xem</Button>
          <Button danger onClick={() => handleDelete(record.id)}>
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 w-full">
        <Search
          placeholder="Tìm kiếm batch"
          onSearch={(value) => setSearchKeyword(value)}
          allowClear
          className="flex-1"
        />
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          + Thêm dữ liệu
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={batches}
        loading={loading}
        pagination={{
          current: page + 1,
          pageSize: limit,
          total: total,
          onChange: (pageNumber) => setPage(pageNumber - 1),
        }}
      />

      <Modal
        title="Thêm Batch"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        okText="Thêm"
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleAddBatch}>
          <Form.Item
            name="name"
            label="Tên Batch"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea />
          </Form.Item>

          <Form.Item label="File">
            <Upload
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              maxCount={1}
            >
              <Button>Chọn file</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
