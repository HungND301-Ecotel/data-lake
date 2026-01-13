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
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { useParams } from "react-router-dom";
import { wareDataRowApi } from "../api/wareDataRowApi";
import { wareMappingApi } from "../api/wareMappingApi";
import { wareBatchApi } from "../api/wareBathApi";
import type { WareDataRowResponse } from "../types/wareDataRow";
import type { WareMappingResponse } from "../types/wareMapping";

export const WareBatchDetail: React.FC = () => {
  const wareBatchId = Number(
    useParams<{ wareBatchId: string }>().wareBatchId ?? 0
  );

  const [rows, setRows] = useState<WareDataRowResponse[]>([]);
  const [mappings, setMappings] = useState<WareMappingResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [pushModalVisible, setPushModalVisible] = useState(false);
  const [deleteMissing, setDeleteMissing] = useState(false);
  const [messageApi, contextHolderMessage] = message.useMessage();

  const [form] = Form.useForm();

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
    } catch (error: any) {
      messageApi.error(error?.data || "Push batch thất bại");
    }
  };

  return (
    <div className="px-4 py-4 min-h-screen">
      {contextHolderMessage}

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
          <Button
            type="primary"
            className="bg-[#1a8649]! hover:bg-[#15703d]!"
            onClick={handlePushClick}
          >
            Upload dữ liệu TKV
          </Button>
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
    </div>
  );
};
