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
  Tooltip,
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
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  // EyeOutlined,
} from "@ant-design/icons";

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
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [modal, contextHolderModal] = Modal.useModal();

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
      messageApi.error("Lấy danh sách batch thất bại");
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
      messageApi.success("Thêm batch thành công");
      setIsModalOpen(false);
      setFileList([]);
      form.resetFields();
      fetchBatches();
    } catch (error) {
      console.error(error);
      messageApi.error("Thêm batch thất bại");
    }
  };

  const handleDelete = async (id: string | number) => {
    modal.confirm({
      title: "Xác nhận xóa",
      icon: <ExclamationCircleOutlined />,
      content: "Bạn có chắc chắn muốn xóa template này?",
      okType: "danger",
      onOk: async () => {
        try {
          await wareBatchApi.deleteWareBatch(String(id));
          messageApi.success("Xóa batch thành công");
          fetchBatches();
        } catch (error) {
          messageApi.error("Xóa batch thất bại");
        }
      },
    });
  };

  const handleEyeClick = (record: WareBatchResponse) => {
    if (record.isPushed) {
      nav(`/ware/batch/${record.id}/actions`);
    } else {
      messageApi.info("Batch chưa đẩy dữ liệu");
    }
  };

  const formatVNDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const columns: ColumnsType<WareBatchResponse> = [
    { title: "Mã", dataIndex: "code", key: "code" },
    { title: "Tên", dataIndex: "name", key: "name" },
    { title: "Mô tả", dataIndex: "description", key: "description" },
    { title: "Người tạo", dataIndex: "employeeName", key: "employeeName" },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => formatVNDate(value),
    },
    {
      title: "Upload",
      dataIndex: "isPushed",
      key: "isPushed",
      align: "center",
      render: (value: boolean, record) => (
        <Tooltip title={value ? "Đã đẩy dữ liệu" : "Chưa đẩy dữ liệu"}>
          {value ? (
            <CheckCircleOutlined
              style={{
                fontSize: 18,
                color: "#52c41a",
                cursor: "pointer",
              }}
              onClick={() => handleEyeClick(record)}
            />
          ) : (
            <CloseCircleOutlined
              style={{
                fontSize: 18,
                color: "#ff4d4f",
                cursor: "pointer",
              }}
            />
          )}
        </Tooltip>
      ),
    },

    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => nav(`/ware/batch/${record.id}`)}
            >
              Xem
            </Button>
          <Button
              type="link"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id!)}
              danger
            >
              Xóa
            </Button>
          {/* <Tooltip title="Xem chi tiết">
            <EyeOutlined
              style={{
                fontSize: 18,
                cursor: "pointer",
                color: "#1677ff",
              }}
              onClick={() => handleEyeClick(record)}
            />
          </Tooltip> */}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {contextHolderMessage}
      {contextHolderModal}
      <div className="flex items-center gap-4 mb-4 w-full">
        <Search
          placeholder="Tìm kiếm batch"
          onSearch={(value) => setSearchKeyword(value)}
          allowClear
          className="flex-1"
        />
        <Button type="primary" className="bg-[#1a8649]! hover:bg-[#15703d]!" onClick={() => setIsModalOpen(true)}>
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
