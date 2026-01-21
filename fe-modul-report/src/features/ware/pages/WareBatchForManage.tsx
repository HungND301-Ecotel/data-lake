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
} from "../types/wareBacth";
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

export const WareBatchForManagement: React.FC = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState<string | null>(null);
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
            const res = await wareBatchApi.getMyApprovals();
            console.log("Fetched batches:", res);
            setBatches(res);
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

    const handleEyeClick = (record: any) => {
        if (record.isPushed) {
            nav(`/ware/batch/${record.batchId}/actions`);
        } else {
            messageApi.info("Batch chưa đẩy dữ liệu");
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: {
            [key: string]: { bg: string; text: string; label: string };
        } = {
            Cho_Phe_Duyet: {
                bg: "#ff9c6e",
                text: "#fff",
                label: "Chờ duyệt",
            },
            Da_Phe_Duyet: {
                bg: "#52c41a",
                text: "#fff",
                label: "Đã duyệt",
            },
            Tu_Choi_Phe_Duyet: {
                bg: "#ff4d4f",
                text: "#fff",
                label: "Từ chối",
            },
        };

        const config = statusConfig[status] || {
            bg: "#d9d9d9",
            text: "#000",
            label: status,
        };

        return (
            <span
                style={{
                    display: "inline-block",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    backgroundColor: config.bg,
                    color: config.text,
                    fontWeight: "500",
                    fontSize: "12px",
                }}
            >
                {config.label}
            </span>
        );
    };

    const columns: ColumnsType<any> = [
        { title: "Mã", dataIndex: "batchCode", key: "batchCode" },
        { title: "Tên", dataIndex: "batchName", key: "batchName" },
        { title: "Mô tả", dataIndex: "batchDescription", key: "batchDescription" },
        { title: "Trạng thái duyệt của bạn", dataIndex: "myApprovalStatus", key: "myApprovalStatus", render: (status: string) => getStatusBadge(status), },
        {
            title: "Trạng thái duyệt tổng",
            dataIndex: "batchStatus",
            key: "batchStatus",
            render: (status: string) => getStatusBadge(status),
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
            align: "center",
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => nav(`/ware/batch/${record.batchId}`)}
                    >
                        Xem
                    </Button>
                    <Button
                        type="link"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.batchId!)}
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
            <div className="flex px-4 py-4 items-center gap-4 mb-4 w-full">
                <Search
                    placeholder="Tìm kiếm batch"
                    onSearch={(value) => setSearchKeyword(value)}
                    allowClear
                    className="flex-1"
                />
                <Button
                    type="primary"
                    className="bg-[#1a8649]! hover:bg-[#15703d]!"
                    onClick={() => setIsModalOpen(true)}
                >
                    + Thêm dữ liệu
                </Button>
            </div>

            <div className="overflow-auto">
                <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={batches}
                    loading={loading}
                />
            </div>

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