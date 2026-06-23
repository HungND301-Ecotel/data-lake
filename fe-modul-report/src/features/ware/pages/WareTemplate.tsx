import { useEffect, useState } from "react";
import {
  Collapse,
  Table,
  Button,
  Input,
  Modal,
  Form,
  Select,
  message,
  Space,
  Card,
  Tag,
  Upload,
} from "antd";
import {
  ExclamationCircleOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  PlusOutlined,
  SettingOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  AppstoreOutlined,
  UploadOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import { wareTemplateApi } from "../api/wareTemplateApi";
import { wareCategoryApi } from "../api/wareCategoryApi";
import type {
  WareTemplateResponse,
  WareTemplateRequest,
} from "../types/wareTemplate";
import type { WareCategoryResponse } from "../types/wareCategory";
import { useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const { Panel } = Collapse;
const { Option } = Select;

type WareTemplateGroup = {
  id: number;
  code: string;
  name: string;
  templates: WareTemplateResponse[];
};

type DecodedToken = {
  role: string;
  [key: string]: any;
};

const WareTemplate = () => {
  const [groups, setGroups] = useState<WareTemplateGroup[]>([]);
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WareTemplateResponse | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [modal, contextHolderModal] = Modal.useModal();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { departmentId } = useParams<{ departmentId: string }>();
  const nav = useNavigate();
  const [configCheckModal, setConfigCheckModal] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<WareTemplateResponse | null>(null);
  const [excelFileList, setExcelFileList] = useState<UploadFile[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        console.log("Decoded token:", decoded);
        setUserRole(decoded.role);
      } catch (err) {
        console.error("Error decoding token:", err);
      }
    }
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await wareCategoryApi.searchWareCategory({
          page: 0,
          limit: 100,
          keyword: searchText,
          departmentId: departmentId,
        });

        const initGroups: WareTemplateGroup[] = res.content.map(
          (cat: WareCategoryResponse) => ({
            id: cat.id!,
            code: cat.code!,
            name: cat.name!,
            templates: [],
          }),
        );

        setGroups(initGroups);
      } catch (err) {
        console.error(err);
        messageApi.error("Lỗi tải danh sách category");
      }
    };

    fetchCategories();
  }, [searchText, departmentId]);

  const loadTemplatesByCategory = async (categoryId: number) => {
    const idx = groups.findIndex((g) => g.id === categoryId);
    if (idx === -1) return;

    try {
      const res = await wareTemplateApi.searchWareTemplate({
        page: 0,
        limit: 100,
        wareCategoryId: categoryId,
        keyword: searchText,
      });

      let data = res;

      const newGroups = [...groups];
      newGroups[idx].templates = data;
      setGroups(newGroups);
    } catch (err) {
      console.error(err);
      messageApi.error("Lỗi tải template");
    }
  };

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    setExcelFileList([]);
    setModalOpen(true);
  };

  const handleExportExcel = async (record: WareTemplateResponse) => {
    try {
      const blob = await wareTemplateApi.exportTemplateExcel(record.id);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${record.code || record.name || `template-${record.id}`}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      messageApi.success("Xuất file Excel thành công");
    } catch (err: any) {
      messageApi.error(
        err?.response?.data?.message || "Xuất file Excel thất bại",
      );
    }
  };

  const handleDelete = (id: number, categoryId: number) => {
    modal.confirm({
      title: "Xác nhận xóa",
      icon: <ExclamationCircleOutlined />,
      content: "Bạn có chắc chắn muốn xóa template này?",
      okType: "danger",
      onOk: async () => {
        await wareTemplateApi.deleteWareTemplate(Number(id));
        messageApi.success("Xóa thành công");
        loadTemplatesByCategory(categoryId);
      },
    });
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      const request: WareTemplateRequest = {
        ...values,
        id: editing?.id,
        excelFile: excelFileList[0]?.originFileObj as File | undefined,
      };

      if (editing) {
        await wareTemplateApi.updateWareTemplate(request);
        messageApi.success("Cập nhật thành công");
      } else {
        await wareTemplateApi.saveWareTemplate(request);
        messageApi.success("Thêm mới thành công");
      }

      setModalOpen(false);
      setExcelFileList([]);
      if (values.wareCategoryId) {
        loadTemplatesByCategory(values.wareCategoryId);
      }
    } catch (err) {
      console.error(err);
      messageApi.error("Thao tác thất bại");
    }
  };

  const handleApproveOrInput = (
    record: WareTemplateResponse,
    action: "approve" | "input",
  ) => {
    if (!record.hasApprovalConfig) {
      setSelectedRecord(record);
      setConfigCheckModal(true);
    } else {
      if (action === "approve") {
        nav(`/ware/template/approve/${record.id}`);
      } else {
        nav(`/ware/template/${record.id}`);
      }
    }
  };

  const handleGoToConfig = () => {
    if (selectedRecord) {
      setConfigCheckModal(false);
      nav(`/ware/template/detail/${selectedRecord.id}`);
    }
  };

  const canApprove = userRole === "ADMIN" || userRole === "USER";

  const columns: ColumnsType<WareTemplateResponse> = [
    {
      title: "Mã Template",
      dataIndex: "code",
      width: 160,
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-blue-500" />
          <span className="font-medium text-gray-800">{text}</span>
        </div>
      ),
    },
    {
      title: "Tên Template",
      dataIndex: "name",
      width: 280,
      render: (text: string) => (
        <span className="text-gray-700 font-medium">{text}</span>
      ),
    },
    {
      title: "Tên Bảng",
      dataIndex: "tableName",
      width: 240,
      render: (text: string) => (
        <Tag color="purple" className="px-3 py-1">
          {text}
        </Tag>
      ),
    },
    {
      title: "Thao tác",
      width: canApprove ? 400 : 320,
      align: "center" as const,
      render: (_: any, record) => (
        <Space size="small">
          <Button
            icon={<SettingOutlined />}
            size="large"
            className="bg-blue-600! hover:bg-blue-700! text-white! border-0"
            onClick={() => nav(`/ware/template/detail/${record.id}`)}
          >
            Cấu hình
          </Button>

          <Button
            icon={<EditOutlined />}
            size="large"
            className="bg-orange-500! hover:bg-orange-600! text-white! border-0"
            onClick={() => handleApproveOrInput(record, "input")}
          >
            Nhập Liệu
          </Button>

          <Button
            icon={<DownloadOutlined />}
            size="large"
            className="bg-green-600! hover:bg-green-700! text-white! border-0"
            onClick={() => handleExportExcel(record)}
          >
            Xuất Excel
          </Button>

          <Button
            danger
            icon={<DeleteOutlined />}
            size="large"
            onClick={() =>
              handleDelete(
                record.id!,
                groups.find((g) => g.templates.some((t) => t.id === record.id))
                  ?.id!,
              )
            }
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="px-6 py-6 min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {contextHolderMessage}
      {contextHolderModal}

      <Card className="shadow-lg border-0 rounded-xl">
        {/* Search and Action Bar */}
        <div className="flex gap-3 mb-6">
          <Input
            placeholder="Tìm kiếm template theo tên, mã..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            size="large"
            className="flex-1"
            style={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />

          <Button
            size="large"
            icon={<PlusOutlined />}
            onClick={handleAdd}
            className="bg-[#1976D2]! hover:bg-blue-700! text-white! border-0 shadow-md"
            style={{ borderRadius: "8px", minWidth: "160px" }}
          >
            Thêm mới
          </Button>
        </div>

        {/* Statistics Bar */}
        <div className="mb-6 p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-2">
            <AppstoreOutlined className="text-blue-500 text-xl" />
            <span className="font-medium text-gray-700">Tổng số danh mục:</span>
            <Tag color="blue" className="font-bold text-base px-3 py-1">
              {groups.length}
            </Tag>
          </div>
        </div>

        {/* Template Categories */}
        <div className="flex flex-col gap-4">
          {groups.map((grp) => (
            <Collapse
              key={grp.id}
              accordion={false}
              onChange={() => loadTemplatesByCategory(grp.id)}
              className="modern-collapse "
            >
              <Panel
                header={
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20">
                        <AppstoreOutlined className="text-white! text-lg" />
                      </div>
                      <div>
                        <span className="text-white font-semibold text-base">
                          {grp.name}
                        </span>
                        <div className="text-white/80 text-sm">
                          Mã: {grp.code}
                        </div>
                      </div>
                    </div>
                    <Tag
                      color="white"
                      className="text-green-700! font-medium! px-3 py-1"
                    >
                      {grp.templates.length} template
                    </Tag>
                  </div>
                }
                key={grp.id}
              >
                <div className="overflow-auto bg-white rounded-lg">
                  <Table
                    dataSource={grp.templates}
                    columns={columns}
                    rowKey="id"
                    pagination={false}
                    size="middle"
                    className="modern-template-table"
                    rowClassName="hover:bg-blue-50 transition-colors"
                  />
                </div>
              </Panel>
            </Collapse>
          ))}
        </div>
      </Card>

      {/* Modal Thêm/Sửa Template */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
              {editing ? (
                <EditOutlined className="text-green-600 text-lg" />
              ) : (
                <PlusOutlined className="text-green-600 text-lg" />
              )}
            </div>
            <div className="text-lg font-semibold text-gray-800">
              {editing ? "Sửa template" : "Thêm template mới"}
            </div>
          </div>
        }
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => {
          setModalOpen(false);
          setExcelFileList([]);
        }}
        okText={editing ? "Lưu" : "Thêm"}
        cancelText="Hủy"
        width={700}
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
        <Form form={form} layout="vertical" className="mt-6">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label={
                <span className="font-medium text-gray-700">
                  Tên template <span className="text-red-500">*</span>
                </span>
              }
              rules={[{ required: true, message: "Vui lòng nhập tên" }]}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Input
                placeholder="VD: Template báo cáo"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="wareCategoryId"
              label={
                <span className="font-medium text-gray-700">
                  Danh mục <span className="text-red-500">*</span>
                </span>
              }
              rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Select
                placeholder="Chọn danh mục"
                size="large"
                className="rounded-lg"
              >
                {groups.map((g) => (
                  <Option key={g.id} value={g.id}>
                    {g.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="tableName"
              label={
                <span className="font-medium text-gray-700">Tên bảng</span>
              }
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Input
                placeholder="VD: table_report"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="tableCode"
              label={
                <span className="font-medium text-gray-700">Mã bảng</span>
              }
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Input
                placeholder="VD: TBL001"
                size="large"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="startRow"
              label={
                <span className="font-medium text-gray-700">Dòng bắt đầu</span>
              }
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Input
                placeholder="VD: 1"
                size="large"
                className="rounded-lg"
                type="number"
              />
            </Form.Item>

            <Form.Item
              label={<span className="font-medium text-gray-700">File mẫu Excel</span>}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Upload
                accept=".xlsx,.xls"
                maxCount={1}
                beforeUpload={(file) => {
                  setExcelFileList([
                    {
                      uid: file.uid,
                      name: file.name,
                      status: "done",
                      originFileObj: file,
                    },
                  ]);
                  return false;
                }}
                onRemove={() => {
                  setExcelFileList([]);
                  return true;
                }}
                fileList={excelFileList}
              >
                <Button icon={<UploadOutlined />}>Chọn file Excel</Button>
              </Upload>
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label={<span className="font-medium text-gray-700">Mô tả</span>}
            labelCol={{ span: 24 }}
            wrapperCol={{ span: 24 }}
          >
            <Input.TextArea
              placeholder="Nhập mô tả chi tiết..."
              rows={3}
              size="large"
              className="rounded-lg"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Cấu hình chưa hoàn thành */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-orange-100">
              <AlertOutlined className="text-orange-600 text-lg" />
            </div>
            <div className="text-lg font-semibold text-gray-800">
              Cấu hình chưa hoàn thành
            </div>
          </div>
        }
        open={configCheckModal}
        onCancel={() => {
          setConfigCheckModal(false);
          setSelectedRecord(null);
        }}
        footer={null}
        centered
        width={500}
      >
        <div className="py-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertOutlined className="text-orange-500 text-xl shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-gray-800 mb-2 text-base">
                  Bảng này chưa có cấu hình người duyệt
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Vui lòng chọn cấu hình để xác định người duyệt cho bảng này
                  trước khi tiếp tục thao tác.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <CheckCircleOutlined className="text-blue-600 text-base mt-0.5" />
              <p className="text-blue-900 text-sm m-0">
                Hãy vào phần <strong>Cấu hình</strong> để thiết lập thông tin
                cần thiết cho template này
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setConfigCheckModal(false);
                setSelectedRecord(null);
              }}
              size="large"
              className="flex-1 h-10"
            >
              Huỷ
            </Button>
            <Button
              type="primary"
              onClick={handleGoToConfig}
              size="large"
              className="flex-1 bg-green-600! hover:bg-green-700! h-10 font-medium"
            >
              Đi tới cấu hình
            </Button>
          </div>
        </div>
      </Modal>

      <style>{`
        .modern-template-table .ant-table {
          font-size: 14px;
        }
        .modern-template-table .ant-table-thead > tr > th {
          background: linear-gradient(to right, #f8fafc, #f1f5f9);
          color: #1e293b;
          font-weight: 600;
          border-bottom: 2px solid #e2e8f0;
          padding: 16px;
        }
        .modern-template-table .ant-table-tbody > tr > td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .modern-template-table .ant-table-tbody > tr:hover > td {
          background: #eff6ff !important;
        }
        
        .modern-collapse .ant-collapse-item {
          border-radius: 12px !important;
          overflow: hidden;
          margin-bottom: 0;
          border: none !important;
        }
        
        .modern-collapse .ant-collapse-header {
          background: linear-gradient(135deg, #1976D2 0%, #15703d 100%) !important;
          padding: 20px 24px !important;
          border-radius: 12px !important;
          align-items: center !important;
        }
        
        .modern-collapse .ant-collapse-content {
          border-top: none !important;
          background: #f8fafc;
          border-radius: 0 0 12px 12px;
        }
        
        .modern-collapse .ant-collapse-content-box {
          padding: 16px !important;
        }
        
        .modern-collapse .ant-collapse-item-active .ant-collapse-header {
          border-radius: 12px 12px 0 0 !important;
        }
        
        .ant-card {
          border-radius: 16px;
        }
        .ant-modal-header {
          border-radius: 12px 12px 0 0;
          padding: 20px 24px;
        }
        .ant-modal-content {
          border-radius: 12px;
        }
        .ant-input,
        .ant-input-affix-wrapper,
        .ant-select .ant-select-selector {
          transition: all 0.3s ease;
        }
        .ant-input:focus,
        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        .ant-select-focused .ant-select-selector {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1) !important;
        }
        .bg-gradient-to-br {
          background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
        }
        .bg-gradient-to-r {
          background: linear-gradient(to right, #eff6ff, #eef2ff);
        }
      `}</style>
    </div>
  );
};

export default WareTemplate;
