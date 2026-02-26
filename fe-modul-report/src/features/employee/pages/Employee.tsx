import { useEffect, useState } from "react";
import {
  Table,
  Input,
  Button,
  Avatar,
  Space,
  Tag,
  message,
  Modal,
  Form,
  Select,
  Upload,
  Card,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserAddOutlined,
  UploadOutlined,
  UserOutlined,
  EditOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { employeeApi } from "../api/employeeApi";
import { departmentApi } from "../../department/api/departmentApi";
import type { EmployeeResponse, EmployeeRequest } from "../types/employee";
import type { UserRequest, UserResponse } from "../types/user";
import type { DepartmentResponse } from "../../department/types/department";
import { userApi } from "../../auth/api/userApi";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/847/847969.png";

const EmployeePage = () => {
  const [employees, setEmployees] = useState<EmployeeResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [searchText, setSearchText] = useState("");
  const [filterDepartmentId, setFilterDepartmentId] = useState<string | null>(
    null
  );

  const [createEmployeeModal, setCreateEmployeeModal] = useState(false);
  const [employeeDetailModal, setEmployeeDetailModal] = useState(false);
  const [userDetailModal, setUserDetailModal] = useState(false);

  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeResponse | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserResponse | null>(null);

  const [formEmployee] = Form.useForm();
  const [formEmployeeDetail] = Form.useForm();
  const [formUserDetail] = Form.useForm();

  const [messageApi, contextHolderMessage] = message.useMessage();
  const [modal, contextHolderModal] = Modal.useModal();

  const loadEmployees = async (
    keyword = searchText,
    departmentId: string | null = filterDepartmentId
  ) => {
    try {
      const res = await employeeApi.searchEmployee(keyword, 0, 50);
      let list = res.content;
      if (departmentId)
        list = list.filter((e) => e.departments.some((d) => d.id === departmentId));
      setEmployees(list);
      setTotal(res.totalElements);
    } catch {
      message.error("Lỗi tải danh sách nhân viên");
    }
  };

  const loadDepartments = async () => {
    try {
      const res = await departmentApi.searchDepartment("", 0, 200);
      setDepartments(res.content);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadDepartments();
  }, []);

  const handleDeleteEmployee = async (id: string) => {
    modal.confirm({
      title: "Xoá nhân viên?",
      content: "Hành động này không thể hoàn tác!",
      okText: "Xoá",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await employeeApi.deleteEmployee(id);
          messageApi.success("Đã xoá nhân viên");
          loadEmployees();
        } catch {
          messageApi.error("Lỗi xoá nhân viên");
        }
      },
    });
  };

  const handleShowEmployeeDetail = async (id: string) => {
    try {
      const emp = await employeeApi.getEmployee(id);
      setSelectedEmployee(emp);
      formEmployeeDetail.setFieldsValue({
        ...emp,
        departmentIds: emp.departments.map((d) => d.id),
        birthday: emp.birthday,
      });
      setEmployeeDetailModal(true);
    } catch {
      messageApi.error("Không lấy được thông tin nhân viên");
    }
  };

  const handleShowUserDetail = async (employeeId: string) => {
    try {
      const user = await userApi.getByEmployeeId(employeeId);
      setSelectedUser(user);
      formUserDetail.setFieldsValue({
        username: user.username,
        role: user.role,
        status: user.status,
      });
      setUserDetailModal(true);
    } catch {
      messageApi.error("Không lấy được thông tin tài khoản");
    }
  };

  const handleSaveUserDetail = async () => {
    try {
      const values = await formUserDetail.validateFields();
      const request: UserRequest = {
        id: selectedUser?.id || null,
        username: values.username,
        password: selectedUser ? null : values.password,
        role: values.role,
        employeeId: selectedEmployee?.id || "",
        status: values.status,
      };
      if (!selectedUser) {
        await userApi.addUser(request);
        messageApi.success("Tạo tài khoản thành công");
      } else {
        await userApi.updateUser(request);
        messageApi.success("Cập nhật tài khoản thành công");
      }
      setUserDetailModal(false);
      loadEmployees();
    } catch (err) {
      console.log(err);
      messageApi.error("Lỗi lưu tài khoản");
    }
  };

  // Table columns
  const columns = [
    {
      title: "",
      dataIndex: "keyAvatar",
      key: "avatar",
      width: "5%",
      align: "center" as const,
      render: (value: string | null) => (
        <Avatar src={value || DEFAULT_AVATAR} size={48} />
      ),
    },
    {
      title: "Họ và tên",
      dataIndex: "name",
      key: "name",
      width: "15%",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <UserOutlined className="text-gray-400" />
          <span className="font-medium text-gray-800">{text}</span>
        </div>
      ),
    },
    {
      title: "Chức vụ",
      dataIndex: "position",
      key: "position",
      width: "12%",
      render: (text: string) => (
        <Tag color="blue" className="px-3 py-1">
          {text}
        </Tag>
      ),
    },
    {
      title: "SĐT",
      dataIndex: "phone",
      key: "phone",
      width: "12%",
      render: (text: string) => (
        <span className="text-gray-600">{text}</span>
      ),
    },
    {
      title: "Phòng ban",
      dataIndex: "departments",
      key: "departments",
      width: "15%",
      render: (depts: { id: string; name: string }[]) => {
        if (!depts || depts.length === 0) return <span className="text-gray-400">—</span>;
        const first = depts[0];
        const remainCount = depts.length - 1;
        return (
          <div className="flex items-center gap-1">
            <TeamOutlined className="text-blue-500" />
            <span className="text-gray-700 truncate max-w-[100px]">{first.name}</span>
            {remainCount > 0 && (
              <Tag color="geekblue" className="ml-1 shrink-0">+{remainCount}</Tag>
            )}
          </div>
        );
      },
    },
    {
      title: "Ngày sinh",
      dataIndex: "birthday",
      key: "birthday",
      width: "10%",
      render: (text: string) => (
        <span className="text-gray-600">{text}</span>
      ),
    },
    {
      title: "Tài khoản",
      dataIndex: "role",
      key: "role",
      width: "13%",
      align: "center" as const,
      render: (_role: string | null, record: EmployeeResponse) =>
        _role ? (
          <Tag color="green" className="px-3 py-1 cursor-pointer">
            {_role}{" "}
            <EyeOutlined
              style={{ marginLeft: 8 }}
              onClick={() => handleShowUserDetail(record.id)}
            />
          </Tag>
        ) : (
          <Button
            icon={<UserAddOutlined />}
            size="small"
            className="bg-purple-500 hover:bg-purple-600 text-white border-0"
            onClick={() => {
              setSelectedEmployee(record);
              setSelectedUser(null);
              formUserDetail.resetFields();
              setUserDetailModal(true);
            }}
          >
            Tạo tài khoản
          </Button>
        ),
    },
    {
      title: "Hành động",
      key: "actions",
      width: "18%",
      align: "center" as const,
      render: (_: any, record: EmployeeResponse) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            className="bg-green-600! hover:bg-green-700! text-white! border-0"
            onClick={() => handleShowEmployeeDetail(record.id)}
          >
            Chi tiết
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteEmployee(record.id)}
          >
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="px-6 py-6 min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {contextHolderModal}
      {contextHolderMessage}

      {/* Main Card */}
      <Card className="shadow-lg border-0 rounded-xl">
        <div className="font-semibold mb-2 text-lg text-blue-600">/ Danh mục nhân viên</div>
        {/* Search and Action Bar */}
        <div className="flex gap-3 mb-6">
          <Input
            placeholder="Tìm kiếm theo tên, chức vụ..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={() => loadEmployees(searchText, filterDepartmentId)}
            size="large"
            className="flex-1"
            style={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          />

          <Select
            placeholder="Lọc theo phòng ban"
            allowClear
            size="large"
            style={{ width: 240, borderRadius: "8px" }}
            value={filterDepartmentId}
            onChange={(value) => {
              const deptId = value || null;
              setFilterDepartmentId(deptId);
              loadEmployees(searchText, deptId);
            }}
          >
            {departments.map((dept) => (
              <Select.Option key={dept.id} value={dept.id}>
                {dept.name}
              </Select.Option>
            ))}
          </Select>

          <Button
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setCreateEmployeeModal(true)}
            className="bg-green-600! hover:bg-green-700! text-white! border-0 shadow-md"
            style={{ borderRadius: "8px", minWidth: "160px" }}
          >
            Thêm nhân viên
          </Button>
        </div>

        {/* Statistics Bar */}
        <div className="mb-4 p-4 bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserOutlined className="text-blue-500 text-xl" />
              <span className="font-medium text-gray-700">
                Tổng số nhân viên:
              </span>
              <Tag color="blue" className="font-bold text-base px-3 py-1">
                {total}
              </Tag>
            </div>
            {(searchText || filterDepartmentId) && (
              <div className="text-sm text-gray-600">
                Tìm thấy <span className="font-semibold">{employees.length}</span> kết quả
              </div>
            )}
          </div>
        </div>

        {/* Employee Table */}
        <Table
          dataSource={employees}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 8,
            total,
            showSizeChanger: false,
            showTotal: (total) => `Tổng ${total} nhân viên`,
            className: "mt-4",
          }}
          size="middle"
          scroll={{ x: "100%" }}
          className="modern-employee-table"
          rowClassName="hover:bg-blue-50 transition-colors"
        />
      </Card>

      {/* Modal Thêm nhân viên */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-100">
              <PlusOutlined className="text-green-600 text-lg" />
            </div>
            <div className="text-lg font-semibold text-gray-800">
              Thêm nhân viên mới
            </div>
          </div>
        }
        open={createEmployeeModal}
        okText="Thêm"
        cancelText="Hủy"
        width={700}
        onCancel={() => setCreateEmployeeModal(false)}
        okButtonProps={{
          className: "bg-green-600! hover:bg-green-700! text-white! border-0 h-10 px-6 text-base font-medium",
          size: "large",
        }}
        cancelButtonProps={{
          size: "large",
          className: "h-10 px-6 text-base"
        }}
        onOk={async () => {
          try {
            const values = await formEmployee.validateFields();
            const request: EmployeeRequest = {
              id: null,
              name: values.name,
              email: values.email,
              phone: values.phone,
              address: values.address,
              birthday: values.birthday,
              gender: values.gender,
              position: values.position,
              departmentIds: values.departmentIds,
              avatarFile: null,
            };

            await employeeApi.saveEmployee(request);
            messageApi.success("Đã thêm nhân viên");
            setCreateEmployeeModal(false);
            formEmployee.resetFields();
            loadEmployees();
          } catch (e) {
            messageApi.error("Lỗi thêm nhân viên");
          }
        }}
      >
        <Form form={formEmployee} layout="horizontal" className="mt-6">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label={<span className="font-medium text-gray-700">Họ và tên <span className="text-red-500">*</span></span>}
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Input placeholder="VD: Nguyễn Văn A" size="large" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="email"
              label={<span className="font-medium text-gray-700">Email <span className="text-red-500">*</span></span>}
              rules={[{ required: true, message: "Vui lòng nhập email" }]}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Input placeholder="example@company.com" size="large" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="phone"
              label={<span className="font-medium text-gray-700">Số điện thoại <span className="text-red-500">*</span></span>}
              rules={[{ required: true, message: "Vui lòng nhập SĐT" }]}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Input placeholder="0912345678" size="large" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="birthday"
              label={<span className="font-medium text-gray-700">Ngày sinh</span>}
              rules={[{ required: false, message: "Vui lòng chọn ngày sinh" }]}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Input type="date" size="large" className="rounded-lg" />
            </Form.Item>
            <Form.Item
              name="gender"
              label={<span className="font-medium text-gray-700">Giới tính</span>}
              rules={[{ required: false, message: "Vui lòng chọn giới tính" }]}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Select placeholder="Chọn giới tính" size="large" className="rounded-lg">
                <Select.Option value="MALE">Nam</Select.Option>
                <Select.Option value="FEMALE">Nữ</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="position"
              label={<span className="font-medium text-gray-700">Chức vụ <span className="text-red-500">*</span></span>}
              rules={[{ required: true, message: "Vui lòng nhập chức vụ" }]}
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
            >
              <Input placeholder="VD: Nhân viên, Trưởng phòng" size="large" className="rounded-lg" />
            </Form.Item>
          </div>
          <Form.Item
            name="address"
            label={<span className="font-medium text-gray-700">Địa chỉ</span>}
            rules={[{ required: false, message: "Vui lòng nhập địa chỉ" }]}
            labelCol={{ span: 24 }}
            wrapperCol={{ span: 24 }}
          >
            <Input placeholder="123 Đường ABC, Quận XYZ" size="large" className="rounded-lg" />
          </Form.Item>
          <Form.Item
            name="departmentIds"
            label={<span className="font-medium text-gray-700">Phòng ban <span className="text-red-500">*</span></span>}
            rules={[{ required: true, message: "Vui lòng chọn phòng ban" }]}
            labelCol={{ span: 24 }}
            wrapperCol={{ span: 24 }}
          >
            <Select placeholder="Chọn phòng ban" mode="multiple" size="large" className="rounded-lg">
              {departments.map((dept) => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Chi tiết nhân viên */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
              <EditOutlined className="text-blue-600 text-lg" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">
                Chi tiết nhân viên
              </div>
              {selectedEmployee && (
                <div className="text-sm text-gray-500">{selectedEmployee.name}</div>
              )}
            </div>
          </div>
        }
        open={employeeDetailModal}
        okText="Lưu"
        cancelText="Hủy"
        width={800}
        onCancel={() => setEmployeeDetailModal(false)}
        okButtonProps={{
          className: "bg-green-600! hover:bg-green-700! text-white! border-0 h-10 px-6 text-base font-medium",
          size: "large",
        }}
        cancelButtonProps={{
          size: "large",
          className: "h-10 px-6 text-base"
        }}
        onOk={async () => {
          try {
            const values = await formEmployeeDetail.validateFields();

            const request: EmployeeRequest = {
              id: selectedEmployee?.id || "",
              name: values.name,
              email: values.email,
              phone: values.phone,
              address: values.address,
              birthday: values.birthday,
              gender: values.gender,
              position: values.position,
              departmentIds: values.departmentIds,
              avatarFile: null,
            };

            await employeeApi.updateEmployee(request);
            message.success("Cập nhật nhân viên thành công");
            setEmployeeDetailModal(false);
            loadEmployees();
          } catch {
            message.error("Lỗi cập nhật nhân viên");
          }
        }}
      >
        <Form form={formEmployeeDetail} layout="vertical" className="mt-6">
          <Form.Item label="" className="flex items-center justify-center">
            <Avatar
              size={100}
              src={selectedEmployee?.keyAvatar || DEFAULT_AVATAR}
              className="border-4 border-gray-200"
            />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="name" label={<span className="font-medium text-gray-700">Họ và tên</span>}>
              <Input size="large" className="rounded-lg" />
            </Form.Item>
            <Form.Item name="email" label={<span className="font-medium text-gray-700">Email</span>}>
              <Input size="large" className="rounded-lg" />
            </Form.Item>
            <Form.Item name="phone" label={<span className="font-medium text-gray-700">SĐT</span>}>
              <Input size="large" className="rounded-lg" />
            </Form.Item>
            <Form.Item name="birthday" label={<span className="font-medium text-gray-700">Ngày sinh</span>}>
              <Input type="date" size="large" className="rounded-lg" />
            </Form.Item>
            <Form.Item name="gender" label={<span className="font-medium text-gray-700">Giới tính</span>}>
              <Select size="large" className="rounded-lg">
                <Select.Option value="MALE">Nam</Select.Option>
                <Select.Option value="FEMALE">Nữ</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="position" label={<span className="font-medium text-gray-700">Chức vụ</span>}>
              <Input size="large" className="rounded-lg" />
            </Form.Item>
          </div>
          <Form.Item name="address" label={<span className="font-medium text-gray-700">Địa chỉ</span>}>
            <Input size="large" className="rounded-lg" />
          </Form.Item>
          <Form.Item name="departmentIds" label={<span className="font-medium text-gray-700">Phòng ban</span>}>
            <Select
              mode="multiple"
              size="large"
              className="rounded-lg"
              optionFilterProp="children"
              placeholder="Chọn phòng ban"
              tagRender={(props) => {
                const dept = departments.find((d) => d.id === props.value);
                return (
                  <Tag
                    color="blue"
                    closable={props.closable}
                    onClose={props.onClose}
                    className="flex items-center gap-1 my-0.5"
                    icon={<TeamOutlined />}
                  >
                    {dept?.name || props.label}
                  </Tag>
                );
              }}
            >
              {departments.map((dept) => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="avatarFile"
            label={<span className="font-medium text-gray-700">Thay đổi Avatar</span>}
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Upload beforeUpload={() => false} maxCount={1} listType="picture">
              <Button icon={<UploadOutlined />} size="large" className="rounded-lg">
                Chọn ảnh
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Chi tiết tài khoản */}
      <Modal
        title={
          <div className="flex items-center gap-3 pb-3 border-b">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedUser ? 'bg-blue-100' : 'bg-purple-100'
              }`}>
              <UserOutlined className={selectedUser ? "text-blue-600 text-lg" : "text-purple-600 text-lg"} />
            </div>
            <div className="text-lg font-semibold text-gray-800">
              {selectedUser ? `Chi tiết tài khoản: ${selectedUser.username}` : "Tạo tài khoản"}
            </div>
          </div>
        }
        open={userDetailModal}
        okText={selectedUser ? "Lưu" : "Tạo"}
        cancelText="Hủy"
        onCancel={() => setUserDetailModal(false)}
        onOk={handleSaveUserDetail}
        width={600}
        okButtonProps={{
          className: "bg-green-600! hover:bg-green-700! text-white! border-0 h-10 px-6 text-base font-medium",
          size: "large",
        }}
        cancelButtonProps={{
          size: "large",
          className: "h-10 px-6 text-base"
        }}
      >
        <Form
          form={formUserDetail}
          layout="vertical"
          className="mt-6"
        >
          <Form.Item
            name="username"
            label={<span className="font-medium text-gray-700">Tên đăng nhập <span className="text-red-500">*</span></span>}
            rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
          >
            <Input placeholder="username" size="large" className="rounded-lg" />
          </Form.Item>
          {!selectedUser && (
            <Form.Item
              name="password"
              label={<span className="font-medium text-gray-700">Mật khẩu <span className="text-red-500">*</span></span>}
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
            >
              <Input.Password placeholder="••••••••" size="large" className="rounded-lg" />
            </Form.Item>
          )}
          <Form.Item
            name="role"
            label={<span className="font-medium text-gray-700">Vai trò <span className="text-red-500">*</span></span>}
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
          >
            <Select placeholder="Chọn vai trò" size="large" className="rounded-lg">
              <Select.Option value="ADMIN">ADMIN</Select.Option>
              <Select.Option value="USER">Người dùng</Select.Option>
              <Select.Option value="MANAGER">Quản lí</Select.Option>
            </Select>
          </Form.Item>
          {selectedUser && (
            <Form.Item
              name="status"
              label={<span className="font-medium text-gray-700">Trạng thái</span>}
            >
              <Select size="large" className="rounded-lg">
                <Select.Option value={true}>Hoạt động</Select.Option>
                <Select.Option value={false}>Khóa</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <style>{`
        .modern-employee-table .ant-table {
          font-size: 14px;
        }
        .modern-employee-table .ant-table-thead > tr > th {
          background: linear-gradient(to right, #f8fafc, #f1f5f9);
          color: #1e293b;
          font-weight: 600;
          border-bottom: 2px solid #e2e8f0;
          padding: 16px;
        }
        .modern-employee-table .ant-table-tbody > tr > td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .modern-employee-table .ant-table-tbody > tr:hover > td {
          background: #eff6ff !important;
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
        .ant-input, .ant-input-affix-wrapper, .ant-select .ant-select-selector {
          transition: all 0.3s ease;
        }
        .ant-input:focus, .ant-input-affix-wrapper:focus, .ant-input-affix-wrapper-focused {
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

export default EmployeePage;