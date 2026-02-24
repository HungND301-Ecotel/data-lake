import React, { useEffect, useState } from "react";
import { Input, Button, message, Tabs, Modal, Card, Tag, Avatar, Space } from "antd";
import type {
  WareTemplateRequest,
  WareTemplateResponse,
} from "../types/wareTemplate";
import { wareTemplateApi } from "../api/wareTemplateApi";
import { approvalConfigsApi } from "../api/wareConfigApi";
import { employeeApi } from "../../employee/api/employeeApi";
import {
  EditOutlined,
  PlusOutlined,
  CloseOutlined,
  SaveOutlined,
  ReloadOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SearchOutlined,
  TeamOutlined,
  FileTextOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

interface TemplateFormProps {
  templateId: number;
}

interface ApprovalConfig {
  id?: number;
  approverId: string;
  approverName?: string;
  approvalOrder: number;
  isActive: boolean;
}

interface Employee {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  position: string;
  phone: string;
  email: string;
  address: string;
  gender: string;
  birthday: string;
  keyAvatar: string | null;
  role: string | null;
}

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

export const TemplateForm: React.FC<TemplateFormProps> = ({ templateId }) => {
  const [template, setTemplate] = useState<WareTemplateResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [request, setRequest] = useState<WareTemplateRequest | null>(null);
  const [approvalConfigs, setApprovalConfigs] = useState<ApprovalConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [isApprovalModalVisible, setIsApprovalModalVisible] = useState(false);
  const [editingApproverIndex, setEditingApproverIndex] = useState<number | null>(
    null
  );

  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [tempApprovers, setTempApprovers] = useState<string[]>([]);
  const [searchEmployee, setSearchEmployee] = useState("");
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  const fetchTemplate = async () => {
    try {
      const res = await wareTemplateApi.getWareTemplateById(templateId);
      setTemplate(res);

      setRequest({
        id: res.id,
        code: res.code,
        name: res.name,
        description: res.description,
        startRow: res.startRow,
        wareCategoryId: 0,
        tableName: res.tableName,
        tableCode: res.tableCode,
      });
    } catch (err) {
      message.error("Lấy thông tin template thất bại");
    }
  };

  const fetchApprovalConfigs = async () => {
    setLoadingConfigs(true);
    try {
      const res = await approvalConfigsApi.getByTemplateId(
        templateId.toString()
      );
      setApprovalConfigs(res.data.configs || []);
    } catch (err) {
      message.error("Lấy cấu hình người duyệt thất bại");
    } finally {
      setLoadingConfigs(false);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const res = await employeeApi.searchEmployee("", 0, 10000000);
      setAllEmployees(res.content || []);
      setFilteredEmployees(res.content || []);
    } catch (err) {
      message.error("Lấy danh sách nhân viên thất bại");

    }
  };

  useEffect(() => {
    fetchTemplate();
    fetchApprovalConfigs();
  }, [templateId]);

  useEffect(() => {
    if (isApprovalModalVisible && allEmployees.length === 0) {
      fetchAllEmployees();
    }
  }, [isApprovalModalVisible]);

  useEffect(() => {
    if (!searchEmployee) {
      setFilteredEmployees(allEmployees);
    } else {
      const filtered = allEmployees.filter((emp) => {
        const name = emp.name || "";
        const email = emp.email || "";
        const id = emp.id || "";
        const searchLower = searchEmployee.toLowerCase();
        return (
          name.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower) ||
          id.toLowerCase().includes(searchLower)
        );
      });
      setFilteredEmployees(filtered);
    }
  }, [searchEmployee, allEmployees]);

  const updateField = <K extends keyof WareTemplateRequest>(
    key: K,
    value: WareTemplateRequest[K]
  ) => {
    setRequest((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!request) return;

    if (!request.name) {
      message.warning("Template Name không được để trống");
      return;
    }

    try {
      await wareTemplateApi.updateWareTemplate(request);
      message.success("Cập nhật template thành công");
      setIsEditing(false);
      fetchTemplate();
    } catch (err) {
      message.error(
        (err as any)?.response?.data?.message || "Cập nhật template thất bại"
      );
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchTemplate();
  };

  const handleOpenApprovalModal = () => {
    setTempApprovers(approvalConfigs.map((config) => config.approverId));
    setEditingApproverIndex(null);
    setSearchEmployee("");
    setIsApprovalModalVisible(true);
  };

  const handleApprovalModalCancel = () => {
    setIsApprovalModalVisible(false);
    setEditingApproverIndex(null);
    setTempApprovers([]);
    setSearchEmployee("");
  };

  const handleSelectApproverToEdit = (index: number) => {
    setEditingApproverIndex(index);
    setSearchEmployee("");
  };

  const handleCancelEditApprover = () => {
    setEditingApproverIndex(null);
    setSearchEmployee("");
  };

  const handleSelectNewApprover = (employeeId: string) => {
    if (editingApproverIndex !== null) {
      const newApprovers = [...tempApprovers];
      newApprovers[editingApproverIndex] = employeeId;
      setTempApprovers(newApprovers);
      setEditingApproverIndex(null);
      setSearchEmployee("");
      message.success("Đã cập nhật người duyệt");
    }
  };

  const handleAddNewApprover = () => {
    if (!searchEmployee) {
      message.warning("Vui lòng chọn nhân viên");
      return;
    }

    const selectedEmployee = filteredEmployees.find(
      (emp) => emp.id === searchEmployee
    );
    if (!selectedEmployee) {
      message.warning("Nhân viên không tồn tại");
      return;
    }

    if (tempApprovers.includes(searchEmployee)) {
      message.warning("Người duyệt này đã có trong danh sách");
      return;
    }

    setTempApprovers([...tempApprovers, searchEmployee]);
    setSearchEmployee("");
    message.success("Đã thêm người duyệt");
  };

  const handleRemoveApprover = (index: number) => {
    const newApprovers = tempApprovers.filter((_, i) => i !== index);
    setTempApprovers(newApprovers);
    if (editingApproverIndex === index) {
      setEditingApproverIndex(null);
      setSearchEmployee("");
    }
  };

  const handleSaveApprovalConfig = async () => {
    if (tempApprovers.length === 0) {
      message.warning("Vui lòng thêm ít nhất một người duyệt");
      return;
    }

    try {
      const configs = tempApprovers.map((approverId, index) => {
        const existingConfig = approvalConfigs.find(
          (c) => c.approverId === approverId
        );

        return {
          ...(existingConfig?.id && { id: existingConfig.id }),
          approverId,
          approvalOrder: index + 1,
        };
      });

      await approvalConfigsApi.update(templateId.toString(), { configs });
      message.success("Lưu cấu hình thành công");
      setIsApprovalModalVisible(false);
      setEditingApproverIndex(null);
      setTempApprovers([]);
      setSearchEmployee("");
      fetchApprovalConfigs();
    } catch (err) {
      message.error("Lưu cấu hình thất bại");
    }
  };

  const getEmployeeInfo = (employeeId: string) => {
    const employee = allEmployees.find((emp) => emp.id === employeeId);
    return employee || null;
  };

  if (!request) return null;

  const hasApprovalConfigs = approvalConfigs.length > 0;

  const tabItems = [
    {
      key: "1",
      label: (
        <span className="flex items-center gap-2 text-base">
          <FileTextOutlined />
          Cấu hình dữ liệu
        </span>
      ),
      children: (
        <Card className="shadow-sm border-0">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                <FileTextOutlined className="text-blue-600 text-lg" />
              </div>
              <h1 className="text-xl font-bold text-gray-800 m-0">
                Cấu hình dữ liệu
              </h1>
            </div>

            {isEditing ? (
              <Space>
                <Button
                  size="large"
                  onClick={handleCancel}
                  className="h-10 px-6"
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  className="bg-black! hover:bg-gray-700! h-10 px-6"
                >
                  Lưu
                </Button>
              </Space>
            ) : (
              <Button
                type="primary"
                size="large"
                icon={<EditOutlined />}
                onClick={() => setIsEditing(true)}
                className="bg-black! hover:bg-gray-700! h-10 px-6"
              >
                Chỉnh sửa
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Mã báo cáo
              </label>
              <Input
                value={request.code ?? ""}
                disabled
                size="large"
                className="rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Tên báo cáo
              </label>
              <Input
                value={request.name}
                disabled={!isEditing}
                onChange={(e) => updateField("name", e.target.value)}
                size="large"
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Mã bảng
              </label>
              <Input
                value={request.tableCode}
                disabled={!isEditing}
                onChange={(e) => updateField("tableCode", e.target.value)}
                size="large"
                className="rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Tên bảng
              </label>
              <Input
                value={request.tableName}
                disabled={!isEditing}
                onChange={(e) => updateField("tableName", e.target.value)}
                size="large"
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Mô tả
              </label>
              <Input
                value={request.description}
                disabled={!isEditing}
                onChange={(e) => updateField("description", e.target.value)}
                size="large"
                className="rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Dòng bắt đầu dữ liệu
              </label>
              <Input
                type="number"
                value={request.startRow}
                disabled={!isEditing}
                onChange={(e) => updateField("startRow", Number(e.target.value))}
                size="large"
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-2 items-center gap-2">
                <CalendarOutlined className="text-gray-400" />
                Thời gian tạo
              </label>
              <Input
                value={
                  template ? new Date(template.createdAt).toLocaleString() : ""
                }
                disabled
                size="large"
                className="rounded-lg"
              />
            </div>

            <div>
              <label className="block font-medium text-gray-700 mb-2 items-center gap-2">
                <CalendarOutlined className="text-gray-400" />
                Thời gian cập nhật gần nhất
              </label>
              <Input
                value={
                  template ? new Date(template.updatedAt).toLocaleString() : ""
                }
                disabled
                size="large"
                className="rounded-lg"
              />
            </div>
          </div>
        </Card>
      ),
    },
    {
      key: "2",
      label: (
        <span className="flex items-center gap-2 text-base">
          <TeamOutlined />
          Cấu hình người duyệt
        </span>
      ),
      children: (
        <Card className="shadow-sm border-0 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100">
                <TeamOutlined className="text-black text-lg" />
              </div>
              <h1 className="text-xl font-bold text-gray-800 m-0">
                Cấu hình người duyệt
              </h1>
            </div>
            <Space>
              <Button
                size="large"
                icon={<ReloadOutlined />}
                onClick={() => fetchApprovalConfigs()}
                loading={loadingConfigs}
                className="h-10 px-6"
              >
                Tải lại
              </Button>
              <Button
                type="primary"
                size="large"
                icon={hasApprovalConfigs ? <EditOutlined /> : <PlusOutlined />}
                onClick={handleOpenApprovalModal}
                className="bg-black! hover:bg-gray-700! h-10 px-6"
              >
                {hasApprovalConfigs ? "Chỉnh sửa người duyệt" : "Thêm mới người duyệt"}
              </Button>
            </Space>
          </div>

          {loadingConfigs ? (
            <div className="text-center py-12">
              <ReloadOutlined className="text-4xl text-blue-500 animate-spin mb-3" />
              <p className="text-gray-500">Đang tải...</p>
            </div>
          ) : approvalConfigs.length > 0 ? (
            <div className="space-y-4">
              {approvalConfigs.map((config, index) => (
                <div
                  key={index}
                  className="p-5 border border-gray-200 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2 items-center gap-2">
                        <UserOutlined className="text-blue-500" />
                        Người duyệt
                      </label>
                      <div className="flex items-center gap-2">
                        <Tag color="blue" className="px-3 py-1 text-base">
                          {config.approverName}
                        </Tag>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Thứ tự duyệt
                      </label>
                      <Tag color="purple" className="px-3 py-1 text-base font-semibold">
                        #{config.approvalOrder}
                      </Tag>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Trạng thái
                      </label>
                      {config.isActive ? (
                        <Tag
                          icon={<CheckCircleOutlined />}
                          color="success"
                          className="px-3 py-1"
                        >
                          Kích hoạt
                        </Tag>
                      ) : (
                        <Tag
                          icon={<CloseCircleOutlined />}
                          color="error"
                          className="px-3 py-1"
                        >
                          Không kích hoạt
                        </Tag>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-200 mx-auto mb-4">
                <TeamOutlined className="text-4xl text-gray-400" />
              </div>
              <p className="text-gray-500 mb-6 text-lg">
                Không có cấu hình người duyệt
              </p>

            </div>
          )}
        </Card>
      ),
    },
  ];

  return (
    <>
      <div className="px-6 py-6 bg-linear-to-br from-gray-50 to-gray-100">
        <Tabs
          defaultActiveKey="1"
          items={tabItems}
          size="large"
          className=""
        />
      </div>

      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100">
              {hasApprovalConfigs ? (
                <EditOutlined className="text-black text-lg" />
              ) : (
                <PlusOutlined className="text-black text-lg" />
              )}
            </div>
            <div className="text-lg font-semibold text-gray-800">
              {hasApprovalConfigs
                ? "Chỉnh sửa cấu hình người duyệt"
                : "Thêm cấu hình người duyệt"}
            </div>
          </div>
        }
        open={isApprovalModalVisible}
        onOk={handleSaveApprovalConfig}
        onCancel={handleApprovalModalCancel}
        okText="Lưu"
        cancelText="Hủy"
        width={800}
        okButtonProps={{
          className:
            "bg-black! hover:bg-gray-700! text-white! border-0 h-10 px-6 text-base font-medium",
          size: "large",
        }}
        cancelButtonProps={{
          size: "large",
          className: "h-10 px-6 text-base",
        }}
      >
        <div className="py-4">
          <label className="block mb-4 font-semibold text-gray-800 text-base items-center gap-2">
            <TeamOutlined className="text-black" />
            Danh sách người duyệt
          </label>

          {tempApprovers.length > 0 ? (
            <div className="mb-6 space-y-3">
              {tempApprovers.map((approverId, idx) => {
                const employee = getEmployeeInfo(approverId);
                const isEditing = editingApproverIndex === idx;

                return (
                  <div
                    key={idx}
                    className={`p-4 transition-all ${isEditing
                        ? "border-2 border-black bg-gray-50 shadow-md"
                        : "border border-gray-200 bg-white hover:shadow-md"
                      }`}
                  >
                    {isEditing ? (
                      <div>
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-green-200">
                          <div className="flex items-center gap-3">
                            <Avatar
                              src={employee?.keyAvatar || DEFAULT_AVATAR}
                              size={48}
                            />
                            <div>
                              <div className="font-semibold text-gray-800">
                                Đang chỉnh sửa: {employee?.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Thứ tự: #{idx + 1}
                              </div>
                            </div>
                          </div>
                          <Button
                            icon={<CloseOutlined />}
                            onClick={handleCancelEditApprover}
                            className="h-9"
                          >
                            Hủy
                          </Button>
                        </div>

                        <Input
                          placeholder="Tìm kiếm nhân viên mới"
                          prefix={<SearchOutlined className="text-gray-400" />}
                          value={searchEmployee}
                          onChange={(e) => setSearchEmployee(e.target.value)}
                          size="large"
                          className="mb-3 rounded-lg"
                        />

                        {searchEmployee && filteredEmployees.length > 0 && (
                          <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                            {filteredEmployees.map((emp) => (
                              <div
                                key={emp.id}
                                onClick={() => handleSelectNewApprover(emp.id)}
                                className={`p-3 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors ${emp.id === approverId ? "bg-green-50" : ""
                                  }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar
                                    src={emp.keyAvatar || DEFAULT_AVATAR}
                                    size={40}
                                  />
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-800">
                                      {emp.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {emp.email} • {emp.position}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={employee?.keyAvatar || DEFAULT_AVATAR}
                            size={48}
                          />
                          <div>
                            <div className="font-semibold text-gray-800 mb-1">
                              {employee?.name || approverId}
                            </div>
                            <div className="text-sm text-gray-500">
                              {employee?.email} • {employee?.position}
                            </div>
                            <Tag color="purple" className="mt-1">
                              Thứ tự: #{idx + 1}
                            </Tag>
                          </div>
                        </div>
                        <Space>
                          <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => handleSelectApproverToEdit(idx)}
                            className="bg-blue-600! hover:bg-blue-700!"
                          >
                            Sửa
                          </Button>
                          <Button
                            danger
                            icon={<CloseOutlined />}
                            onClick={() => handleRemoveApprover(idx)}
                          >
                            Xóa
                          </Button>
                        </Space>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg mb-6">
              <UserOutlined className="text-4xl text-gray-300 mb-2" />
              <p className="text-gray-400">Chưa có người duyệt nào</p>
            </div>
          )}

          {editingApproverIndex === null && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <label className="block mb-3 font-semibold text-gray-800 items-center gap-2">
                <PlusOutlined className="text-blue-600" />
                Thêm người duyệt mới
              </label>
              <Input
                placeholder="Tìm kiếm theo tên, email hoặc ID"
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                size="large"
                className="mb-3 rounded-lg"
              />

              {searchEmployee && filteredEmployees.length > 0 && (
                <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto mb-3 bg-white">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      onClick={() => setSearchEmployee(emp.id)}
                      className={`p-3 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors ${tempApprovers.includes(emp.id) ? "bg-gray-100" : ""
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={emp.keyAvatar || DEFAULT_AVATAR} size={40} />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-800">
                            {emp.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {emp.email} • {emp.position}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button
                type="primary"
                onClick={handleAddNewApprover}
                block
                size="large"
                icon={<PlusOutlined />}
                className="bg-black! hover:bg-gray-700! h-11 font-medium rounded-lg"
              >
                Thêm người duyệt
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <style>{`
        .modern-tabs .ant-tabs-nav {
          background: white;
          padding: 8px 24px 0;
          border-radius: 12px 12px 0 0;
          margin-bottom: 0;
        }
        .modern-tabs .ant-tabs-tab {
          padding: 12px 24px;
          font-size: 15px;
          font-weight: 500;
        }
        .modern-tabs .ant-tabs-tab-active {
          background: linear-gradient(to right, #eff6ff, #eef2ff);
          border-radius: 8px 8px 0 0;
        }
        .modern-tabs .ant-tabs-ink-bar {
          background: #3b82f6;
          height: 3px;
        }
        .ant-card {
          border-radius: 16px;
        }
        .ant-input:focus,
        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        .bg-gradient-to-br {
          background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  );
};