import React, { useEffect, useState } from "react";
import {
  Table,
  Input,
  Row,
  Col,
  Button,
  message,
  Modal,
  Form,
  Radio,
  Alert,
  Space,
  Card,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams } from "react-router-dom";
import { wareDataRowApi } from "../api/wareDataRowApi";
import { wareMappingApi } from "../api/wareMappingApi";
import { wareBatchApi } from "../api/wareBathApi";
import type { WareDataRowResponse } from "../types/wareDataRow";
import type { WareMappingResponse } from "../types/wareMapping";
import type { WareBatchResponse } from "../types/wareBacth";
import {
  SearchOutlined,
  CloudUploadOutlined,
  CloseOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

export const WareBatchDetail: React.FC = () => {
  const wareBatchId = Number(
    useParams<{ wareBatchId: string }>().wareBatchId ?? 0
  );

  const [rows, setRows] = useState<WareDataRowResponse[]>([]);
  const [mappings, setMappings] = useState<WareMappingResponse[]>([]);
  const [batchDetail, setBatchDetail] = useState<WareBatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [pushModalVisible, setPushModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [deleteMissing, setDeleteMissing] = useState(false);
  const [messageApi, contextHolderMessage] = message.useMessage();

  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();

  const fetchBatchDetail = async () => {
    if (!wareBatchId) return;
    try {
      const res = await wareBatchApi.getDetail(wareBatchId);
      setBatchDetail(res);
    } catch (error) {
      messageApi.error("Lấy thông tin batch thất bại");
    }
  };

  const fetchMappings = async () => {
    try {
      const res = await wareMappingApi.getByBatch(wareBatchId);
      setMappings(res);
    } catch (error) {
      messageApi.error("Lấy mapping thất bại");
    }
  };

  const fetchRows = async () => {
    if (!wareBatchId) return;
    setLoading(true);
    try {
      const res = await wareDataRowApi.searchWareDataRow({
        wareBatchId,
        keyword,
        page: 0,
        limit: 1000,
      });
      setRows(res.content);
    } catch (error) {
      messageApi.error("Lấy dữ liệu thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchDetail();
    fetchMappings();
  }, [wareBatchId]);

  useEffect(() => {
    fetchRows();
  }, [wareBatchId, keyword]);

  const defaultColumns: ColumnsType<WareDataRowResponse> = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      render: (text: number) => (
        <span className="font-medium text-gray-800">#{text}</span>
      ),
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => (
        <span className="text-gray-600 text-sm">{formatVNDate(value)}</span>
      ),
    },
    {
      title: "Cập nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (value: string) => (
        <span className="text-gray-600 text-sm">{formatVNDate(value)}</span>
      ),
    },
  ];

  const mappingColumns: ColumnsType<WareDataRowResponse> = mappings.map(
    (m) => ({
      title: m.fieldTitle || m.fieldName,
      dataIndex: ["data", m.fieldName],
      key: m.fieldName,
      render: (value) => (
        <span className="text-gray-700">
          {value == null ? "-" : value.toString()}
        </span>
      ),
    })
  );

  const columns = [...defaultColumns, ...mappingColumns];

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



  const handlePushConfirm = async (values: {
    username: string;
    password: string;
    deleteMissing: boolean;
  }) => {
    if (!wareBatchId) return;

    try {
      const res = await wareBatchApi.pushWareBatch({
        id: wareBatchId,
        deleteMissing: values.deleteMissing,
        username: values.username,
        password: values.password,
      });
      messageApi.success(JSON.stringify(res));
      setPushModalVisible(false);
      fetchBatchDetail();
    } catch (error: any) {
      messageApi.error(error?.data || "Push batch thất bại");
    }
  };


  const handleRejectConfirm = async () => {
    if (!wareBatchId) return;

    try {
      await wareBatchApi.rejectBatch(wareBatchId);
      messageApi.success("Từ chối batch thành công");
      setRejectModalVisible(false);
      rejectForm.resetFields();
      fetchBatchDetail();
    } catch (error: any) {
      messageApi.error(error?.data || "Từ chối batch thất bại");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: {
      [key: string]: { color: string; label: string };
    } = {
      Cho_Phe_Duyet: {
        color: "orange",
        label: "Chờ duyệt",
      },
      Da_Phe_Duyet: {
        color: "success",
        label: "Đã duyệt",
      },
      Tu_Choi_Phe_Duyet: {
        color: "error",
        label: "Từ chối",
      },
    };

    const config = statusConfig[status] || {
      color: "default",
      label: status,
    };

    return (
      <Tag color={config.color} className="px-3 py-1 text-sm font-medium">
        {config.label}
      </Tag>
    );
  };

  // Logic hiển thị nút duyệt và từ chối
  const getActionButtons = () => {
    const status = batchDetail?.status;



    // Trường hợp 4: status = Tu_Choi_Phe_Duyet => Dữ liệu đã bị từ chối
    if (status === "Tu_Choi_Phe_Duyet") {
      return (
        <Tooltip title="Batch đã bị từ chối, không thể duyệt">
          <Button
            disabled
            danger
            size="large"
            icon={<CloseOutlined />}
            className="h-10 px-6"
          >
            Đã từ chối
          </Button>
        </Tooltip>
      );
    }

    return null;
  };

  const isRejected = batchDetail?.status === "Tu_Choi_Phe_Duyet";
  
  return (
    <div className="px-6 py-6 bg-linear-to-br from-gray-50 to-gray-100 min-h-screen">
      {contextHolderMessage}
      {isRejected && (
        <Alert
          message="Batch này đã bị từ chối duyệt"
          type="error"
          showIcon
          closable
          className="mb-6 rounded-lg"
        />
      )}

      <Card className="shadow-sm border-0 rounded-xl mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-linear-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm font-medium mb-1">Mã Batch</p>
            <p className="text-gray-900 font-semibold text-lg">
              {batchDetail?.code || "-"}
            </p>
          </div>
          <div className="bg-linear-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm font-medium mb-1">Tên Batch</p>
            <p className="text-gray-900 font-semibold text-lg">
              {batchDetail?.name || "-"}
            </p>
          </div>
          <div className="bg-linear-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <p className="text-gray-600 text-sm font-medium mb-1">Trạng thái</p>
            <div className="mt-2">
              {batchDetail?.status && getStatusBadge(batchDetail.status)}
            </div>
          </div>
        </div>

        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} lg={19}>
            <Input
              placeholder="Tìm kiếm theo ID..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={fetchRows}
              size="large"
              className="rounded-lg"
            />
          </Col>
          <Col xs={24} sm={12} lg={5} className="text-start">
            <Space>
              <Tooltip title="Tải lại dữ liệu">
                <Button
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={fetchRows}
                  loading={loading}
                  className="h-10 px-6"
                >
                  Tải lại
                </Button>
              </Tooltip>

              {getActionButtons()}

            </Space>
          </Col>
        </Row>
      </Card>

      <Card className="shadow-sm border-0 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
            <SearchOutlined className="text-blue-600 text-lg" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 m-0">
            Dữ liệu chi tiết ({rows.length})
          </h2>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <Table
            rowKey={(record) => record.id ?? Math.random()}
            columns={columns}
            dataSource={rows}
            loading={loading}
            pagination={false}
            size="middle"
            bordered
            rowClassName={(index: any) =>
              index % 2 === 0
                ? "bg-white hover:bg-gray-50 transition-colors"
                : "bg-gray-50 hover:bg-gray-100 transition-colors"
            }
            scroll={{ x: 1300 }}
          />
        </div>

        {rows.length === 0 && !loading && (
          <div className="text-center py-16 bg-gray-50 rounded-lg mt-4">
            <SearchOutlined className="text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500 text-lg">Không có dữ liệu</p>
          </div>
        )}
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="w-10 h-10 flex items-center justify-center bg-blue-100">
              <CloudUploadOutlined className="text-blue-600 text-lg" />
            </div>
            <div className="text-lg font-semibold text-gray-800">
              Upload dữ liệu TKV
            </div>
          </div>
        }
        open={pushModalVisible}
        onCancel={() => setPushModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handlePushConfirm}
          className="py-4"
        >
          <Form.Item
            label={<span className="font-medium text-gray-800">Xoá dữ liệu cũ</span>}
            name="deleteMissing"
            rules={[{ required: true, message: "Vui lòng chọn có hoặc không!" }]}
          >
            <Radio.Group
              onChange={(e) => setDeleteMissing(e.target.value)}
              value={deleteMissing}
              className="text-gray-700"
            >
              <Radio value={true}>Có</Radio>
              <Radio value={false}>Không</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-gray-800">Tên đăng nhập</span>}
            name="username"
            rules={[{ required: true, message: "Vui lòng nhập username!" }]}
          >
            <Input
              placeholder="Nhập tên đăng nhập"
              size="large"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-gray-800">Mật khẩu</span>}
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập password!" }]}
          >
            <Input.Password
              placeholder="Nhập mật khẩu"
              size="large"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              icon={<CloudUploadOutlined />}
              className="bg-[#0891b2]! hover:bg-cyan-7000! h-11 font-medium rounded-lg"
            >
              Upload dữ liệu
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="w-10 h-10 flex items-center justify-center bg-red-100">
              <CloseOutlined className="text-red-600 text-lg" />
            </div>
            <div className="text-lg font-semibold text-gray-800">
              Từ chối batch
            </div>
          </div>
        }
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          form={rejectForm}
          onFinish={handleRejectConfirm}
          className="py-4"
        >
          <Form.Item
            label={<span className="font-medium text-gray-800">Lý do từ chối</span>}
            name="reason"
            rules={[{ required: true, message: "Vui lòng nhập lý do từ chối!" }]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Nhập lý do từ chối batch"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item>
            <Button
              danger
              htmlType="submit"
              block
              size="large"
              icon={<CloseOutlined />}
              className="h-11 font-medium rounded-lg"
            >
              Từ chối batch
            </Button>
          </Form.Item>
        </Form>
      </Modal>

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
        .ant-input-password:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
      `}</style>
    </div>
  );
};