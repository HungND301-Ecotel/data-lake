import React, { useEffect, useState, useMemo } from "react";
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
  Select,
} from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import type { ColumnsType } from "antd/es/table";
import type { WareBatchRequest } from "../types/wareBacth";
import { wareBatchApi } from "../api/wareBathApi";
import { useNavigate, useParams } from "react-router-dom";
import {
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  FileTextOutlined,
  CheckOutlined,
  CloseOutlined,
  FilterOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { departmentApi } from "../../department/api/departmentApi";
import { userPushApi } from "../../auth/api/accountConfigApi";
import type { UserPushResponse } from "../../auth/types/accountConfig";
import { approvalConfigsApi } from "../api/wareConfigApi";
import { getErrorMessage } from "../../../services/erorr";

const { Search } = Input;
const { Option } = Select;

type BatchRecord = any & { id?: string | number };

/**
 * Xác định loại báo cáo:
 *   "year"  — chỉ có reportYear
 *   "month" — có reportYear + reportMonth (không có reportDay)
 *   "day"   — có cả reportYear + reportMonth + reportDay
 */
const getBatchType = (batch: BatchRecord): "year" | "month" | "day" => {
  if (batch.reportDay) return "day";
  if (batch.reportMonth) return "month";
  return "year";
};

/**
 * So sánh hai batch có trùng nhau không (cùng loại + cùng khoảng thời gian + cùng tên).
 * Nếu trùng → cần deleteMissing = true (Cập nhật dữ liệu).
 */
const isDuplicate = (a: BatchRecord, b: BatchRecord): boolean => {
  const nameA = (a.batchName || a.name || "").trim();
  const nameB = (b.batchName || b.name || "").trim();
  if (nameA !== nameB) return false;

  const typeA = getBatchType(a);
  const typeB = getBatchType(b);
  if (typeA !== typeB) return false;

  if (typeA === "year") {
    return String(a.reportYear) === String(b.reportYear);
  }
  if (typeA === "month") {
    return (
      String(a.reportYear) === String(b.reportYear) &&
      String(a.reportMonth) === String(b.reportMonth)
    );
  }
  // day
  return (
    String(a.reportYear) === String(b.reportYear) &&
    String(a.reportMonth) === String(b.reportMonth) &&
    String(a.reportDay) === String(b.reportDay)
  );
};

const calcDeleteMissing = (
  batchToPush: BatchRecord,
  allBatches: BatchRecord[]
): boolean => {
  const alreadyPushed = allBatches.filter(
    (b) => b.isPushed === true && b.batchId !== batchToPush.batchId
  );
  return alreadyPushed.some((existing) => isDuplicate(batchToPush, existing));
};

export const ApproveBatch: React.FC = () => {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm<WareBatchRequest>();
  const { templateId } = useParams<{ templateId: string }>();
  const nav = useNavigate();
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [modal, contextHolderModal] = Modal.useModal();
  const [selectedRowKeys, setSelectedRowKeys] = useState<(string | number)[]>([]);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [departments, setDepartments] = useState<any[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [userPushConfig, setUserPushConfig] = useState<UserPushResponse | null>(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await wareBatchApi.getMyApprovals(departmentFilter || undefined);
      const batchesWithId = res.map((batch: any, index: number) => ({
        ...batch,
        id: batch.batchId || index,
      }));
      setBatches(batchesWithId);
    } catch (error) {
      messageApi.error("Lấy danh sách báo cáo thất bại");
    } finally {
      setLoading(false);
    }
  };

  const loadUserPushConfig = async () => {
    try {
      const res = await userPushApi.getAllUserPush();
      setUserPushConfig(res && res.length > 0 ? res[0] : null);
    } catch {
      setUserPushConfig(null);
    }
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await departmentApi.searchDepartment("", 0, 20000);
        setDepartments(res.content);
      } catch (error) {
        console.error("Lấy danh sách phòng ban thất bại", error);
      }
    };
    fetchDepartments();
    loadUserPushConfig();
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [departmentFilter]);

  useEffect(() => {
    fetchBatches();
  }, []);

  const filteredBatches = useMemo(() => {
    let filtered = [...batches];
    if (searchKeyword && searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase().trim();
      filtered = filtered.filter((batch) =>
        (batch.batchCode || "").toLowerCase().includes(keyword) ||
        (batch.batchName || "").toLowerCase().includes(keyword) ||
        (batch.description || "").toLowerCase().includes(keyword)
      );
    }
    if (statusFilter) {
      filtered = filtered.filter((batch) => batch.myApprovalStatus === statusFilter);
    }
    return filtered;
  }, [batches, searchKeyword, statusFilter]);

  const checkAutoApprove = async (batchList: BatchRecord[]): Promise<boolean> => {
    try {
      console.log("=== checkAutoApprove called ===");

      const firstBatchId = batchList[0]?.batchId;
      if (!firstBatchId) {
        console.warn("Không tìm thấy batchId!");
        return false;
      }

      const batchDetail = await wareBatchApi.getDetail(Number(firstBatchId));
      const tplId = batchDetail?.templateId;
      console.log("templateId from batch detail:", tplId);

      if (!tplId) {
        console.warn("Không tìm thấy templateId trong batch detail!");
        return false;
      }

      const res = await approvalConfigsApi.getByTemplateId(String(tplId));
      console.log("API response:", res);

      const configs: any[] = res?.data?.configs || [];
      console.log("configs:", configs);

      const result = configs.some((c) => c.autoApprove === true);
      console.log("autoApprove result:", result);
      return result;
    } catch (err) {
      console.error("checkAutoApprove error:", err);
      return false;
    }
  };

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
      messageApi.error(getErrorMessage(error, "Thêm batch thất bại"));
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

  /**
   * Duyệt rồi đẩy ngay — không cần modal xác nhận, không cần nhập tài khoản.
   * deleteMissing được tính tự động theo logic trùng lặp loại báo cáo.
   */
  const handleBulkApprove = async () => {
    if (selectedRowKeys.length === 0) {
      messageApi.warning("Vui lòng chọn ít nhất một batch để duyệt");
      return;
    }

    if (!userPushConfig) {
      messageApi.error("Chưa có cấu hình tài khoản đồng bộ. Vui lòng thiết lập trong phần cấu hình.");
      return;
    }

    setApprovalLoading(true);
    try {
      const selectedBatches = batches.filter((b) => selectedRowKeys.includes(b.id));

      // Bước 1: Duyệt tất cả batch được chọn
      await Promise.all(
        selectedBatches.map((batch) => wareBatchApi.approveBatch(batch.batchId))
      );

      // Bước 2: Fetch lại để lấy trạng thái + isPushed mới nhất
      setLoading(true);
      const res = await wareBatchApi.getMyApprovals(departmentFilter || undefined);
      const updatedBatches: BatchRecord[] = res.map((batch: any, index: number) => ({
        ...batch,
        id: batch.batchId || index,
      }));
      setBatches(updatedBatches);
      setLoading(false);

      const shouldAutoPush = await checkAutoApprove(selectedBatches);
      if (!shouldAutoPush) {
        // Không tự push, chỉ duyệt thôi
        messageApi.success(`Đã duyệt thành công ${selectedBatches.length} batch`);
        setSelectedRowKeys([]);
        fetchBatches();
        return;
      }

      // Bước 3: Lọc batch vừa duyệt xong hoàn toàn và chưa được push
      const justApprovedIds = selectedBatches.map((b) => b.batchId);
      const readyToPush = updatedBatches.filter(
        (b) =>
          justApprovedIds.includes(b.batchId) &&
          b.batchStatus === "Da_Phe_Duyet" &&
          !b.isPushed
      );

      if (readyToPush.length === 0) {
        // Batch chưa được duyệt hoàn toàn (còn người duyệt khác) hoặc đã push rồi
        messageApi.success(`Đã duyệt thành công ${selectedBatches.length} batch`);
        setSelectedRowKeys([]);
        return;
      }

      // Bước 4: Đẩy từng batch — tính deleteMissing tự động
      let successCount = 0;
      let failCount = 0;

      for (const batch of readyToPush) {
        const deleteMissing = calcDeleteMissing(batch, updatedBatches);
        try {
          await wareBatchApi.pushWareBatch({
            id: batch.batchId as number,
            deleteMissing,
            username: userPushConfig.username,
            password: userPushConfig.password,
          });
          successCount++;
        } catch {
          failCount++;
        }
      }

      if (failCount === 0) {
        messageApi.success(
          `Đã duyệt và đồng bộ thành công ${successCount} batch`
        );
      } else {
        messageApi.warning(
          `Đã duyệt ${selectedBatches.length} batch. Đồng bộ: ${successCount} thành công, ${failCount} thất bại`
        );
      }

      setSelectedRowKeys([]);
      fetchBatches();
    } catch (error: any) {
      messageApi.error(getErrorMessage(error, "Duyệt batch thất bại"));
    } finally {
      setApprovalLoading(false);
      setLoading(false);
    }
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
          const selectedBatches = batches.filter((b) => selectedRowKeys.includes(b.id));
          await Promise.all(
            selectedBatches.map((batch) => wareBatchApi.rejectBatch(batch.batchId))
          );
          messageApi.success(`Đã từ chối thành công ${selectedRowKeys.length} batch`);
          setSelectedRowKeys([]);
          fetchBatches();
        } catch (error: any) {
          messageApi.error(getErrorMessage(error, "Từ chối batch thất bại"));
        } finally {
          setApprovalLoading(false);
        }
      },
    });
  };

  const handleClearFilters = () => {
    setSearchKeyword("");
    setStatusFilter(null);
    setDepartmentFilter(null);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { color: string; label: string } } = {
      Cho_Phe_Duyet: { color: "orange", label: "Chờ duyệt" },
      Da_Phe_Duyet: { color: "success", label: "Đã duyệt" },
      Tu_Choi_Phe_Duyet: { color: "error", label: "Từ chối" },
    };
    const config = statusConfig[status] || { color: "default", label: status };
    return <Tag color={config.color} className="px-3 py-1 text-sm font-medium">{config.label}</Tag>;
  };

  const getStatusBadge2 = (status: string, canApproveNow?: boolean) => {
    const statusConfig: { [key: string]: { color: string; label: string } } = {
      Cho_Phe_Duyet: {
        color: canApproveNow ? "gold" : "default",
        label: canApproveNow ? "Đến lượt duyệt" : "Chưa đến lượt",
      },
      Da_Phe_Duyet: { color: "success", label: "Đã duyệt" },
      Tu_Choi_Phe_Duyet: { color: "error", label: "Từ chối" },
    };
    const config = statusConfig[status] || { color: "default", label: status };
    return <Tag color={config.color} className="px-3 py-1 text-sm font-medium">{config.label}</Tag>;
  };

  const columns: ColumnsType<BatchRecord> = [
    {
      title: "Mã",
      dataIndex: "batchCode",
      key: "batchCode",
      render: (text: string) => <span className="font-medium text-gray-800">{text}</span>,
    },
    {
      title: "Mã bảng",
      dataIndex: "tableCode",
      key: "tableCode",
      render: (text: string) => <span className="text-gray-800">{text || "-"}</span>,
    },
    {
      title: "Tên báo cáo",
      dataIndex: "reportName",
      key: "reportName",
      render: (text: string) => <span className="text-gray-600">{text || "-"}</span>,
    },
    {
      title: "Năm",
      dataIndex: "reportYear",
      key: "reportYear",
      render: (text: string) => <span className="text-gray-600 line-clamp-2">{text || "-"}</span>,
    },
    {
      title: "Tháng",
      dataIndex: "reportMonth",
      key: "reportMonth",
      render: (text: string) => <span className="text-gray-600 line-clamp-2">{text || "-"}</span>,
    },
    {
      title: "Ngày",
      dataIndex: "reportDay",
      key: "reportDay",
      render: (text: string) => <span className="text-gray-600 line-clamp-2">{text || "-"}</span>,
    },
    {
      title: "Trạng thái của bạn",
      dataIndex: "myApprovalStatus",
      key: "myApprovalStatus",
      render: (status: string, record: BatchRecord) => getStatusBadge2(status, record.canApprove),
    },
    {
      title: "Trạng thái tổng",
      dataIndex: "batchStatus",
      key: "batchStatus",
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: "Upload",
      dataIndex: "isPushed",
      key: "isPushed",
      align: "center",
      width: 100,
      render: (value: boolean) => (
        <Tooltip title={value ? "Đã đẩy dữ liệu" : "Chưa đẩy dữ liệu"}>
          {value ? (
            <CheckCircleOutlined className="text-lg text-green-600!" />
          ) : (
            <CloseCircleOutlined className="text-lg text-red-600!" />
          )}
        </Tooltip>
      ),
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

  const hasApprovableBatch = filteredBatches.some((b) => b.canApprove);

  return (
    <div className="px-6 py-6 bg-linear-to-br from-gray-50 to-gray-100 min-h-screen">
      {contextHolderMessage}
      {contextHolderModal}

      <Card className="shadow-sm border-0 rounded-xl mb-6">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-64">
            <Search
              placeholder="Tìm kiếm theo mã, tên hoặc mô tả..."
              value={searchKeyword}
              onChange={(e) => {
                setSearchKeyword(e.target.value);
                setCurrentPage(1);
              }}
              allowClear
              size="large"
              prefix={<SearchOutlined className="text-gray-400" />}
              className="flex-1 rounded-lg"
            />
            <Select
              placeholder="Lọc theo trạng thái"
              value={statusFilter}
              onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}
              allowClear
              size="large"
              className="w-48"
              suffixIcon={<FilterOutlined />}
            >
              <Option value="Cho_Phe_Duyet"><Tag color="orange">Chờ Duyệt</Tag></Option>
              <Option value="Da_Phe_Duyet"><Tag color="success">Đã Duyệt</Tag></Option>
              <Option value="Tu_Choi_Phe_Duyet"><Tag color="error">Đã Từ Chối</Tag></Option>
            </Select>
            <Select
              placeholder="Lọc theo phòng ban"
              value={departmentFilter}
              onChange={(value) => { setDepartmentFilter(value); setCurrentPage(1); }}
              allowClear
              size="large"
              className="w-48"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) => {
                const label = typeof option?.children === "string" ? option.children : "";
                return label.toLowerCase().includes(input.toLowerCase());
              }}
            >
              {departments.map((dept) => (
                <Option key={dept.id} value={dept.id}>{dept.name}</Option>
              ))}
            </Select>
            {(searchKeyword || statusFilter || departmentFilter) && (
              <Button onClick={handleClearFilters} size="large">Xóa bộ lọc</Button>
            )}
          </div>

          <Space.Compact>
            <Tooltip title="Duyệt và đồng bộ tự động các batch được chọn">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleBulkApprove}
                loading={approvalLoading}
                disabled={!hasApprovableBatch || selectedRowKeys.length === 0}
                className="bg-green-600! hover:bg-green-700! h-10 px-6"
                size="large"
              >
                Duyệt & Đồng bộ ({selectedRowKeys.length})
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
          </Space.Compact>
        </div>
      </Card>

      <Card className="shadow-sm border-0 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100">
              <FileTextOutlined className="text-purple-600 text-lg" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 m-0">Danh sách báo cáo Chờ Duyệt</h1>
          </div>
          <div className="text-sm text-gray-600">
            Hiển thị {filteredBatches.length} / {batches.length} batch
          </div>
        </div>

        <Spin spinning={approvalLoading} tip="Đang duyệt và đồng bộ...">
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <Table
              rowKey="id"
              columns={columns}
              dataSource={filteredBatches}
              loading={loading}
              rowSelection={rowSelection}
              size="middle"
              bordered
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                showSizeChanger: true,
                showTotal: (total) => `Tổng cộng ${total} batch`,
                pageSizeOptions: [10, 20, 50, 100],
                onChange: (page, size) => { setCurrentPage(page); setPageSize(size); },
                onShowSizeChange: (_, size) => { setPageSize(size); setCurrentPage(1); },
              }}
              rowClassName={(record, index) =>
                record.canApprove
                  ? "bg-blue-50 hover:bg-blue-100 transition-colors"
                  : index % 2 === 0
                    ? "bg-white hover:bg-gray-50 transition-colors opacity-75"
                    : "bg-gray-50 hover:bg-gray-100 transition-colors opacity-75"
              }
              scroll={{ x: 1300 }}
            />
          </div>
        </Spin>
      </Card>

      {/* Modal thêm batch */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="w-10 h-10 flex items-center justify-center bg-green-100">
              <PlusOutlined className="text-green-600 text-lg" />
            </div>
            <div className="text-lg font-semibold text-gray-800">Thêm Batch</div>
          </div>
        }
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); setFileList([]); form.resetFields(); }}
        width={700}
        okText="Thêm"
        cancelText="Hủy"
        onOk={() => form.submit()}
        okButtonProps={{
          className: "bg-green-600! hover:bg-green-700! text-white! border-0 h-10 px-6 text-base font-medium",
          size: "large",
        }}
        cancelButtonProps={{ size: "large", className: "h-10 px-6 text-base" }}
      >
        <Form form={form} layout="vertical" onFinish={handleAddBatch} className="py-4">
          <Form.Item
            name="name"
            label={<span className="font-medium text-gray-800">Tên Batch</span>}
            rules={[{ required: true, message: "Vui lòng nhập tên batch" }]}
          >
            <Input placeholder="Nhập tên batch" size="large" className="rounded-lg" />
          </Form.Item>
          <Form.Item name="description" label={<span className="font-medium text-gray-800">Mô tả</span>}>
            <Input.TextArea placeholder="Nhập mô tả (tùy chọn)" rows={4} className="rounded-lg" />
          </Form.Item>
          <Form.Item label={<span className="font-medium text-gray-800">File</span>}>
            <Upload
              beforeUpload={() => false}
              fileList={fileList}
              onChange={({ fileList }) => setFileList(fileList)}
              maxCount={1}
              accept=".xlsx,.xls,.csv"
            >
              <Button icon={<PlusOutlined />} size="large" className="w-full h-10 rounded-lg">
                Chọn file (Excel hoặc CSV)
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
                .bg-linear-to-br { background: linear-gradient(to bottom right, #f9fafb, #f3f4f6); }
                .ant-table-cell { padding: 12px !important; }
                .ant-table-header .ant-table-cell { background: linear-gradient(to right, #f3f4f6, #e5e7eb); font-weight: 600; color: #374151; }
                .ant-table-row { transition: all 0.2s ease; }
                .ant-table-row:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); }
                .ant-input:focus, .ant-input-affix-wrapper:focus, .ant-input-affix-wrapper-focused { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            `}</style>
    </div>
  );
};