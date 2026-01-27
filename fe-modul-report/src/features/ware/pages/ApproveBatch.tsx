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
  Spin,
  Card,
  Tag,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import type { ColumnsType } from "antd/es/table";
import type { WareBatchRequest } from "../types/wareBacth";
import { wareBatchApi } from "../api/wareBathApi";
import { useNavigate, useParams } from "react-router-dom";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  FileTextOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const { Search } = Input;

type BatchRecord = any & { id?: string | number };

export const ApproveBatch: React.FC = () => {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm<WareBatchRequest>();
  const { templateId } = useParams<{ templateId: string }>();
  const nav = useNavigate();
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [modal, contextHolderModal] = Modal.useModal();
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>(
    [],
  );
  const [approvalLoading, setApprovalLoading] = useState(false);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await wareBatchApi.getMyApprovals();
      console.log("Fetched batches:", res);

      const batchesWithId = res.map((batch: any, index: number) => ({
        ...batch,
        id: batch.batchId || index,
      }));

      setBatches(batchesWithId);
    } catch (error) {
      messageApi.error("Lấy danh sách batch thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [searchKeyword]);

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
    } catch (error: any) {
      messageApi.error(error?.data || "Thêm batch thất bại");
    }
  };

  const handleDelete = async (id: string | number) => {
    modal.confirm({
      title: "Xác nhận xóa",
      icon: <ExclamationCircleOutlined />,
      content: "Bạn có chắc chắn muốn xóa batch này?",
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

  const handleBulkApprove = async () => {
    if (selectedRowKeys.length === 0) {
      messageApi.warning("Vui lòng chọn ít nhất một batch để duyệt");
      return;
    }

    modal.confirm({
      title: "Xác nhận duyệt",
      icon: <CheckCircleOutlined />,
      content: `Bạn có chắc chắn muốn duyệt ${selectedRowKeys.length} batch này?`,
      okType: "primary",
      okText: "Duyệt",
      cancelText: "Huỷ",
      onOk: async () => {
        setApprovalLoading(true);
        try {
          const selectedBatches = batches.filter((b) =>
            selectedRowKeys.includes(b.id),
          );

          const approvePromises = selectedBatches.map((batch) =>
            wareBatchApi.approveBatch(batch.batchId),
          );

          await Promise.all(approvePromises);

          messageApi.success(
            `Đã duyệt thành công ${selectedRowKeys.length} batch`,
          );
          setSelectedRowKeys([]);
          fetchBatches();
        } catch (error: any) {
          messageApi.error(error?.data || "Duyệt batch thất bại");
        } finally {
          setApprovalLoading(false);
        }
      },
    });
  };

  const handleBulkReject = async () => {
    if (selectedRowKeys.length === 0) {
      messageApi.warning("Vui lòng chọn ít nhất một batch để từ chối");
      return;
    }

    modal.confirm({
      title: "Xác nhận từ chối",
      icon: <CloseCircleOutlined />,
      content: `Bạn có chắc chắn muốn từ chối ${selectedRowKeys.length} batch này?`,
      okType: "danger",
      okText: "Từ chối",
      cancelText: "Huỷ",
      onOk: async () => {
        setApprovalLoading(true);
        try {
          const selectedBatches = batches.filter((b) =>
            selectedRowKeys.includes(b.id),
          );

          const rejectPromises = selectedBatches.map((batch) =>
            wareBatchApi.rejectBatch(batch.batchId),
          );

          await Promise.all(rejectPromises);

          messageApi.success(
            `Đã từ chối thành công ${selectedRowKeys.length} batch`,
          );
          setSelectedRowKeys([]);
          fetchBatches();
        } catch (error: any) {
          messageApi.error(error?.data || "Từ chối batch thất bại");
        } finally {
          setApprovalLoading(false);
        }
      },
    });
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

    const getStatusBadge2 = (status: string, canApproveNow?: boolean) => {
        const statusConfig: {
            [key: string]: { color: string; label: string };
        } = {
            Cho_Phe_Duyet: {
                color: canApproveNow ? "gold" : "default",
                label: canApproveNow ? "Đến lượt duyệt" : "Chưa đến lượt",
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

    const columns: ColumnsType<BatchRecord> = [
        {
            title: "Mã",
            dataIndex: "batchCode",
            key: "batchCode",
            render: (text: string) => (
                <span className="font-medium text-gray-800">{text}</span>
            ),
        },
        {
            title: "Tên",
            dataIndex: "batchName",
            key: "batchName",
            render: (text: string) => <span className="text-gray-700">{text}</span>,
        },
        {
            title: "Năm",
            dataIndex: "reportYear",
            key: "reportYear",
            render: (text: string) => (
                <span className="text-gray-600 line-clamp-2">{text || "-"}</span>
            ),
        },
        {
            title: "Tháng",
            dataIndex: "reportMonth",
            key: "reportMonth",
            render: (text: string) => (
                <span className="text-gray-600 line-clamp-2">{text || "-"}</span>
            ),
        },
        {
            title: "Ngày",
            dataIndex: "reportDay",
            key: "reportDay",
            render: (text: string) => (
                <span className="text-gray-600 line-clamp-2">{text || "-"}</span>
            ),
        },
        {
            title: "Trạng thái của bạn",
            dataIndex: "myApprovalStatus",
            key: "myApprovalStatus",
            render: (status: string, record: BatchRecord) =>
                getStatusBadge2(status, record.canApprove),
        },
        {
            title: "Trạng thái tổng",
            dataIndex: "batchStatus",
            key: "batchStatus",
            render: (status: string) => getStatusBadge(status),
        },
        {
            title: "Thao tác",
            key: "action",
            align: "center",
            width: 140,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => nav(`/ware/batch-approve/${record.batchId}`)}
                            className="bg-green-600! hover:bg-green-700!"
                            size="large"
                        >
                            Xem
                        </Button>
                    </Tooltip>
                    <Tooltip title="Xóa batch">
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record.batchId!)}
                            size="large"
                        >
                            Xóa
                        </Button>
                    </Tooltip>
                </Space>
            ),
        },
    ];

    const rowSelection = {
        selectedRowKeys,
        onChange: (newSelectedRowKeys: React.Key[]) => {
            setSelectedRowKeys(newSelectedRowKeys as (string | number)[]);
        },
        getCheckboxProps: (record: BatchRecord) => ({
            disabled: !record.canApprove,
        }),
    };

    const hasApprovableBatch = batches.some(b => b.canApprove);

    return (
      <Tag color={config.color} className="px-3 py-1 text-sm font-medium">
        {config.label}
      </Tag>
    );
  };

  const getStatusBadge2 = (status: string, canApproveNow?: boolean) => {
    const statusConfig: {
      [key: string]: { color: string; label: string };
    } = {
      Cho_Phe_Duyet: {
        color: canApproveNow ? "gold" : "default",
        label: canApproveNow ? "Đến lượt duyệt" : "Chưa đến lượt",
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


                    </Space.Compact>
                </div>
            </Card>

            <Card className="shadow-sm border-0 rounded-xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100">
                            <FileTextOutlined className="text-purple-600 text-lg" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-800 m-0">
                            Danh sách Batch Chờ Duyệt
                        </h1>
                    </div>
                </div>

                <Spin spinning={approvalLoading} tip="Đang xử lý...">
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <Table
                            rowKey="id"
                            columns={columns}
                            dataSource={batches}
                            loading={loading}
                            rowSelection={rowSelection}
                            size="middle"
                            bordered
                            pagination={{
                                showSizeChanger: true,
                                showTotal: (total) => `Tổng cộng ${total} batch`,
                                pageSizeOptions: [10, 20, 50],
                            }}
                            rowClassName={(record, index) =>
                                record.canApprove
                                    ? index % 2 === 0
                                        ? "bg-blue-50 hover:bg-blue-100 transition-colors"
                                        : "bg-blue-50 hover:bg-blue-100 transition-colors"
                                    : index % 2 === 0
                                        ? "bg-white hover:bg-gray-50 transition-colors opacity-75"
                                        : "bg-gray-50 hover:bg-gray-100 transition-colors opacity-75"
                            }
                            scroll={{ x: 1300 }}
                        />
                    </div>
                </Spin>
            </Card>

            <Modal
                title={
                    <div className="flex items-center gap-3 pb-3 border-b">
                        <div className="w-10 h-10 flex items-center justify-center bg-green-100">
                            <PlusOutlined className="text-green-600 text-lg" />
                        </div>
                        <div className="text-lg font-semibold text-gray-800">
                            Thêm Batch
                        </div>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false);
                    setFileList([]);
                    form.resetFields();
                }}
                width={700}
                okText="Thêm"
                cancelText="Hủy"
                onOk={() => form.submit()}
                okButtonProps={{
                    className:
                        "bg-green-600! hover:bg-green-700! text-white! border-0 h-10 px-6 text-base font-medium",
                    size: "large",
                }}
                cancelButtonProps={{
                    size: "large",
                    className: "h-10 px-6 text-base",
                }}
            >
              Xem
            </Button>
          </Tooltip>
          <Tooltip title="Xóa batch">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.batchId!)}
              size="large"
            >
              Xóa
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys as (string | number)[]);
    },
    getCheckboxProps: (record: BatchRecord) => ({
      disabled: !record.canApprove,
    }),
  };

  const hasApprovableBatch = batches.some((b) => b.canApprove);

  return (
    <div className="px-6 py-6 bg-linear-to-br from-gray-50 to-gray-100 min-h-screen">
      {contextHolderMessage}
      {contextHolderModal}

      <Card className="shadow-sm border-0 rounded-xl mb-6">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-64">
            <Search
              placeholder="Tìm kiếm theo mã, tên hoặc mô tả..."
              onSearch={(value) => setSearchKeyword(value || null)}
              allowClear
              size="large"
              prefix={<SearchOutlined className="text-gray-400" />}
              className="flex-1 rounded-lg"
              enterButton={
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Tìm kiếm
                </Button>
              }
            />
          </div>

          <Space.Compact>
            <Tooltip title="Duyệt các batch được chọn">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleBulkApprove}
                loading={approvalLoading}
                disabled={!hasApprovableBatch || selectedRowKeys.length === 0}
                className="bg-[#1976D2]! hover:bg-blue-700! h-10 px-6"
                size="large"
              >
                Duyệt ({selectedRowKeys.length})
              </Button>
            </Tooltip>

            <Tooltip title="Từ chối các batch được chọn">
              <Button
                type="primary"
                danger
                icon={<CloseOutlined />}
                onClick={handleBulkReject}
                loading={approvalLoading}
                disabled={!hasApprovableBatch || selectedRowKeys.length === 0}
                className="h-10 px-6"
                size="large"
              >
                Từ chối ({selectedRowKeys.length})
              </Button>
            </Tooltip>

            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={() => setIsModalOpen(true)}
              className="bg-[#1976D2]! hover:bg-blue-700! h-10 px-6"
            >
              Thêm dữ liệu
            </Button>
          </Space.Compact>
        </div>
      </Card>

      <Card className="shadow-sm border-0 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100">
              <FileTextOutlined className="text-purple-600 text-lg" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 m-0">
              Danh sách Batch Chờ Duyệt
            </h1>
          </div>
        </div>

        <Spin spinning={approvalLoading} tip="Đang xử lý...">
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table
              rowKey="id"
              columns={columns}
              dataSource={batches}
              loading={loading}
              rowSelection={rowSelection}
              size="middle"
              bordered
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `Tổng cộng ${total} batch`,
                pageSizeOptions: [10, 20, 50],
              }}
              rowClassName={(record, index) =>
                record.canApprove
                  ? index % 2 === 0
                    ? "bg-blue-50 hover:bg-blue-100 transition-colors"
                    : "bg-blue-50 hover:bg-blue-100 transition-colors"
                  : index % 2 === 0
                    ? "bg-white hover:bg-gray-50 transition-colors opacity-75"
                    : "bg-gray-50 hover:bg-gray-100 transition-colors opacity-75"
              }
              scroll={{ x: 1300 }}
            />
          </div>
        </Spin>
      </Card>

      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="w-10 h-10 flex items-center justify-center bg-blue-100">
              <PlusOutlined className="text-blue-600 text-lg" />
            </div>
            <div className="text-lg font-semibold text-gray-800">
              Thêm Batch
            </div>
          </div>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setFileList([]);
          form.resetFields();
        }}
        width={700}
        okText="Thêm"
        cancelText="Hủy"
        onOk={() => form.submit()}
        okButtonProps={{
          className:
            "bg-[#1976D2]! hover:bg-blue-700! text-white! border-0 h-10 px-6 text-base font-medium",
          size: "large",
        }}
        cancelButtonProps={{
          size: "large",
          className: "h-10 px-6 text-base",
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddBatch}
          className="py-4"
        >
          <Form.Item
            name="name"
            label={<span className="font-medium text-gray-800">Tên Batch</span>}
            rules={[{ required: true, message: "Vui lòng nhập tên batch" }]}
          >
            <Input
              placeholder="Nhập tên batch"
              size="large"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={<span className="font-medium text-gray-800">Mô tả</span>}
          >
            <Input.TextArea
              placeholder="Nhập mô tả (tùy chọn)"
              rows={4}
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium text-gray-800">File</span>}
          >
            <Upload
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              maxCount={1}
              accept=".xlsx,.xls,.csv"
            >
              <Button
                icon={<PlusOutlined />}
                size="large"
                className="w-full h-10 rounded-lg"
              >
                Chọn file (Excel hoặc CSV)
              </Button>
            </Upload>
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
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
    </div>
  );
};
