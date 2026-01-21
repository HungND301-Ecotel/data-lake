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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams } from "react-router-dom";
import { wareDataRowApi } from "../api/wareDataRowApi";
import { wareMappingApi } from "../api/wareMappingApi";
import { wareBatchApi } from "../api/wareBathApi";
import type { WareDataRowResponse } from "../types/wareDataRow";
import type { WareMappingResponse } from "../types/wareMapping";
import type { WareBatchResponse } from "../types/wareBacth";
import { jwtDecode } from "jwt-decode";

type DecodedToken = {
  role: string;
  [key: string]: any;
};

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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [modal, contextHolderModal] = Modal.useModal();

  const [form] = Form.useForm();
  const [rejectForm] = Form.useForm();

  // Lấy token và decode để lấy role
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        setUserRole(decoded.role);
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }
  }, []);

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
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => formatVNDate(value),
    },
    {
      title: "Cập nhật",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (value: string) => formatVNDate(value),
    },
  ];

  const mappingColumns: ColumnsType<WareDataRowResponse> = mappings.map(
    (m) => ({
      title: m.fieldTitle || m.fieldName,
      dataIndex: ["data", m.fieldName],
      key: m.fieldName,
      render: (value) => (value == null ? "" : value.toString()),
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

  const handlePushClick = () => {
    setPushModalVisible(true);
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


  const handleApprove = async () => {
    if (!wareBatchId) return;
    modal.confirm({
      title: "Duyệt batch",
      content: "Bạn có chắc chắn muốn duyệt batch này?",
      okText: "Duyệt",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await wareBatchApi.approveBatch(wareBatchId);
          messageApi.success("Duyệt batch thành công");
          fetchBatchDetail();
        } catch (error: any) {
          messageApi.error(error?.data || "Duyệt batch thất bại");
        }
      },
    });
  };

  const handleRejectClick = () => {
    setRejectModalVisible(true);
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

  const canApprove = userRole === "ADMIN" || userRole === "MANAGER";
  const isPending = batchDetail?.status === "Cho_Phe_Duyet";
  const isRejected = batchDetail?.status === "Tu_Choi_Phe_Duyet";

  const isMyApprovalPending = batchDetail?.myApprovalStatus === "Cho_Phe_Duyet";

  return (
    <div className="px-4 py-4 min-h-screen">
      {contextHolderMessage}
      {contextHolderModal}

      {isRejected && (
        <Alert
          message="Batch này đã bị từ chối duyệt"
          type="error"
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      <Row style={{ marginBottom: 16 }} gutter={8} align="middle">
        <Col span={6}>
          <Input
            placeholder="Tìm kiếm theo ID ... "
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={fetchRows}
          />
        </Col>
        <Col>
          {canApprove && isPending && isMyApprovalPending ? (
            <Space>
              <Button
                type="primary"
                style={{ backgroundColor: "#52c41a" }}
                onClick={handleApprove}
              >
                Duyệt
              </Button>
              <Button
                danger
                onClick={handleRejectClick}
              >
                Từ chối
              </Button>
            </Space>
          ) : !isRejected && !isPending ? (
            <Button
              type="primary"
              className="bg-[#1a8649]! hover:bg-[#15703d]!"
              onClick={handlePushClick}
            >
              Upload dữ liệu TKV
            </Button>
          ) : null}
        </Col>
      </Row>

      <div className="overflow-auto">
        <Table
          rowKey={(record) => record.id ?? Math.random()}
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
        />
      </div>

      <Modal
        title="Upload dữ liệu"
        open={pushModalVisible}
        onCancel={() => setPushModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" form={form} onFinish={handlePushConfirm}>
          <Form.Item
            label="Xoá dữ liệu cũ"
            name="deleteMissing"
            rules={[{ required: true, message: "Chọn có hoặc không!" }]}
          >
            <Radio.Group
              onChange={(e) => setDeleteMissing(e.target.value)}
              value={deleteMissing}
            >
              <Radio value={true}>Có</Radio>
              <Radio value={false}>Không</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Tên đăng nhập"
            name="username"
            rules={[{ required: true, message: "Nhập username!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Nhập password!" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Upload dữ liệu
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Từ chối batch"
        open={rejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" form={rejectForm} onFinish={handleRejectConfirm}>
          <Form.Item
            label="Lý do từ chối"
            name="reason"
            rules={[{ required: true, message: "Vui lòng nhập lý do!" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" danger>
              Từ chối
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};