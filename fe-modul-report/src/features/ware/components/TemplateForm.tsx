import React, { useEffect, useState } from "react";
import { Input, Button, message, Row, Col, Tabs, Modal } from "antd";
import type {
  WareTemplateRequest,
  WareTemplateResponse,
} from "../types/wareTemplate";
import { wareTemplateApi } from "../api/wareTemplateApi";
import { approvalConfigsApi } from "../api/wareConfigApi";
import { employeeApi } from "../../employee/api/employeeApi";
import { EditOutlined, PlusOutlined, CloseOutlined } from "@ant-design/icons";

interface TemplateFormProps {
  templateId: number;
}

interface ApprovalConfig {
  id?: number;
  approverId: string;
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

export const TemplateForm: React.FC<TemplateFormProps> = ({ templateId }) => {
  const [template, setTemplate] = useState<WareTemplateResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [request, setRequest] = useState<WareTemplateRequest | null>(null);
  const [approvalConfigs, setApprovalConfigs] = useState<ApprovalConfig[]>([]);
  const [loadingConfigs, setLoadingConfigs] = useState(false);
  const [isApprovalModalVisible, setIsApprovalModalVisible] = useState(false);
  const [editingApproverIndex, setEditingApproverIndex] = useState<number | null>(null);
  
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
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
      const res = await approvalConfigsApi.getByTemplateId(templateId.toString());
      setApprovalConfigs(res.data.configs || []);
    } catch (err) {
      message.error("Lấy cấu hình người duyệt thất bại");
    } finally {
      setLoadingConfigs(false);
    }
  };

  const fetchAllEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const res = await employeeApi.getAll();
      setAllEmployees(res);
      setFilteredEmployees(res);
    } catch (err) {
      message.error("Lấy danh sách nhân viên thất bại");
    } finally {
      setLoadingEmployees(false);
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
      const filtered = allEmployees.filter(emp => {
        const name = emp.name || "";
        const email = emp.email || "";
        const id = emp.id || "";
        const searchLower = searchEmployee.toLowerCase();
        return name.toLowerCase().includes(searchLower) || 
               email.toLowerCase().includes(searchLower) ||
               id.toLowerCase().includes(searchLower);
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
    // Khởi tạo danh sách người duyệt hiện tại
    setTempApprovers(approvalConfigs.map(config => config.approverId));
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
      // Thay thế người duyệt
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

    const selectedEmployee = filteredEmployees.find(emp => emp.id === searchEmployee);
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
      const configs = tempApprovers.map((approverId, idx) => ({
        ...(approvalConfigs[idx]?.id ? { id: approvalConfigs[idx].id } : {}),
        approverId,
        approvalOrder: idx + 1,
        isActive: true,
      }));

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

  const getEmployeeName = (employeeId: string) => {
    const employee = allEmployees.find(emp => emp.id === employeeId);
    return employee ? employee.name : employeeId;
  };

  const getEmployeeInfo = (employeeId: string) => {
    const employee = allEmployees.find(emp => emp.id === employeeId);
    return employee || null;
  };

  if (!request) return null;

  const hasApprovalConfigs = approvalConfigs.length > 0;

  const tabItems = [
    {
      key: "1",
      label: "Cấu hình dữ liệu",
      children: (
        <div className="px-4 py-4" style={{ background: "#fff" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h1 style={{ fontSize: 20, fontWeight: "bold", margin: 0 }}>
              Cấu hình dữ liệu
            </h1>

            {isEditing ? (
              <div>
                <Button style={{ marginRight: 8 }} onClick={handleCancel}>
                  Hủy
                </Button>
                <Button type="primary" onClick={handleSave}>
                  Lưu
                </Button>
              </div>
            ) : (
              <Button type="primary" className="bg-[#1a8649]! hover:bg-[#15703d]!" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
                Chỉnh sửa
              </Button>
            )}
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <label>Mã báo cáo</label>
              <Input value={request.code ?? ""} disabled />
            </Col>

            <Col span={12}>
              <label>Tên báo cáo</label>
              <Input
                value={request.name}
                disabled={!isEditing}
                onChange={(e) => updateField("name", e.target.value)}
              />
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 12 }}>
            <Col span={12}>
              <label>Mã bảng</label>
              <Input
                value={request.tableCode}
                disabled={!isEditing}
                onChange={(e) => updateField("tableCode", e.target.value)}
              />
            </Col>

            <Col span={12}>
              <label>Tên bảng</label>
              <Input
                value={request.tableName}
                disabled={!isEditing}
                onChange={(e) => updateField("tableName", e.target.value)}
              />
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 12 }}>
            <Col span={12}>
              <label>Mô tả</label>
              <Input
                value={request.description}
                disabled={!isEditing}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </Col>

            <Col span={12}>
              <label>Dòng bắt đầu dữ liệu</label>
              <Input
                type="number"
                value={request.startRow}
                disabled={!isEditing}
                onChange={(e) => updateField("startRow", Number(e.target.value))}
              />
            </Col>
          </Row>

          <Row gutter={16} style={{ marginTop: 12 }}>
            <Col span={12}>
              <label>Thời gian tạo</label>
              <Input
                value={
                  template ? new Date(template.createdAt).toLocaleString() : ""
                }
                disabled
              />
            </Col>

            <Col span={12}>
              <label>Thời gian cập nhật gần nhất</label>
              <Input
                value={
                  template ? new Date(template.updatedAt).toLocaleString() : ""
                }
                disabled
              />
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: "2",
      label: "Cấu hình người duyệt",
      children: (
        <div className="px-4 py-4" style={{ background: "#fff" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h1 style={{ fontSize: 20, fontWeight: "bold", margin: 0 }}>
              Cấu hình người duyệt
            </h1>
            <div>
              <Button
                type="primary"
                className="bg-[#1a8649]! hover:bg-[#15703d]! mr-2"
                icon={hasApprovalConfigs ? <EditOutlined /> : <PlusOutlined />}
                onClick={handleOpenApprovalModal}
              >
                {hasApprovalConfigs ? "Chỉnh sửa" : "Thêm mới"}
              </Button>
              <Button
                onClick={() => fetchApprovalConfigs()}
                loading={loadingConfigs}
              >
                Tải lại
              </Button>
            </div>
          </div>

          {loadingConfigs ? (
            <p>Đang tải...</p>
          ) : approvalConfigs.length > 0 ? (
            <div>
              {approvalConfigs.map((config, index) => (
                <Row
                  gutter={16}
                  key={index}
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    border: "1px solid #d9d9d9",
                    borderRadius: 4,
                  }}
                >
                  <Col span={8}>
                    <label>Người duyệt</label>
                    <Input value={getEmployeeName(config.approverId)} disabled />
                  </Col>
                  <Col span={8}>
                    <label>Thứ tự duyệt</label>
                    <Input value={config.approvalOrder} disabled />
                  </Col>
                  <Col span={8}>
                    <label>Trạng thái</label>
                    <Input
                      value={config.isActive ? "Kích hoạt" : "Không kích hoạt"}
                      disabled
                    />
                  </Col>
                </Row>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p>Không có cấu hình người duyệt</p>
              <Button
                type="primary"
                className="bg-[#1a8649]! hover:bg-[#15703d]!"
                icon={<PlusOutlined />}
                onClick={handleOpenApprovalModal}
              >
                Thêm cấu hình người duyệt
              </Button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Tabs defaultActiveKey="1" items={tabItems} />
      
      <Modal
        title={hasApprovalConfigs ? "Chỉnh sửa cấu hình người duyệt" : "Thêm cấu hình người duyệt"}
        open={isApprovalModalVisible}
        onOk={handleSaveApprovalConfig}
        onCancel={handleApprovalModalCancel}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
      >
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
            Danh sách người duyệt
          </label>
          
          {tempApprovers.length > 0 ? (
            <div style={{ marginBottom: 20 }}>
              {tempApprovers.map((approverId, idx) => {
                const employee = getEmployeeInfo(approverId);
                const isEditing = editingApproverIndex === idx;
                
                return (
                  <div
                    key={idx}
                    style={{
                      padding: 12,
                      border: isEditing ? "2px solid #1a8649" : "1px solid #d9d9d9",
                      borderRadius: 4,
                      marginBottom: 8,
                      backgroundColor: isEditing ? "#f0f9f4" : "#fff",
                    }}
                  >
                    {isEditing ? (
                      <div>
                        <div style={{ 
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          marginBottom: 12 
                        }}>
                          <div>
                            <strong>Đang chỉnh sửa: {employee?.name}</strong>
                            <div style={{ fontSize: 12, color: "#666" }}>Thứ tự: {idx + 1}</div>
                          </div>
                          <Button
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={handleCancelEditApprover}
                          >
                            Hủy
                          </Button>
                        </div>
                        
                        <Input.Search
                          placeholder="Tìm kiếm nhân viên mới"
                          value={searchEmployee}
                          onChange={(e) => setSearchEmployee(e.target.value)}
                          loading={loadingEmployees}
                          style={{ marginBottom: 8 }}
                        />
                        
                        {searchEmployee && filteredEmployees.length > 0 && (
                          <div style={{ 
                            border: "1px solid #d9d9d9", 
                            borderRadius: 4, 
                            maxHeight: 200, 
                            overflowY: "auto"
                          }}>
                            {filteredEmployees.map(emp => (
                              <div
                                key={emp.id}
                                onClick={() => handleSelectNewApprover(emp.id)}
                                style={{
                                  padding: 8,
                                  cursor: "pointer",
                                  borderBottom: "1px solid #f0f0f0",
                                  backgroundColor: emp.id === approverId ? "#e6f4ea" : "transparent",
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = emp.id === approverId ? "#e6f4ea" : "transparent"}
                              >
                                <div><strong>{emp.name}</strong></div>
                                <div style={{ fontSize: 12, color: "#666" }}>
                                  {emp.email} - {emp.position}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center" 
                      }}>
                        <div>
                          <div><strong>{employee?.name || approverId}</strong></div>
                          <div style={{ fontSize: 12, color: "#666" }}>
                            {employee?.email} - {employee?.position}
                          </div>
                          <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                            Thứ tự: {idx + 1}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <Button
                            type="primary"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleSelectApproverToEdit(idx)}
                          >
                            Sửa
                          </Button>
                          <Button
                            danger
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={() => handleRemoveApprover(idx)}
                          >
                            Xóa
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: "#999", marginBottom: 20 }}>Chưa có người duyệt nào</p>
          )}

          {editingApproverIndex === null && (
            <div>
              <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                Thêm người duyệt mới
              </label>
              <Input.Search
                placeholder="Tìm kiếm theo tên, email hoặc ID"
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                loading={loadingEmployees}
                style={{ marginBottom: 8 }}
              />
              
              {searchEmployee && filteredEmployees.length > 0 && (
                <div style={{ 
                  border: "1px solid #d9d9d9", 
                  borderRadius: 4, 
                  maxHeight: 200, 
                  overflowY: "auto",
                  marginBottom: 8
                }}>
                  {filteredEmployees.map(emp => (
                    <div
                      key={emp.id}
                      onClick={() => setSearchEmployee(emp.id)}
                      style={{
                        padding: 8,
                        cursor: "pointer",
                        borderBottom: "1px solid #f0f0f0",
                        backgroundColor: tempApprovers.includes(emp.id) ? "#f0f0f0" : "transparent",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f5f5f5"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = tempApprovers.includes(emp.id) ? "#f0f0f0" : "transparent"}
                    >
                      <div><strong>{emp.name}</strong></div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        {emp.email} - {emp.position}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Button 
                type="primary"
                className="bg-[#1a8649]! hover:bg-[#15703d]!"
                onClick={handleAddNewApprover}
                block
                icon={<PlusOutlined />}
              >
                Thêm người duyệt
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};