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
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserAddOutlined,
  UploadOutlined,
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

  const formItemLayout = { labelCol: { span: 6 }, wrapperCol: { span: 18 } };

  const loadEmployees = async (
    keyword = searchText,
    departmentId: string | null = filterDepartmentId
  ) => {
    try {
      const res = await employeeApi.searchEmployee(keyword, 0, 50);
      let list = res.content;
      if (departmentId)
        list = list.filter((e) => e.departmentId === departmentId);
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
      content: "Bạn có chắc chắn muốn xoá?",
      okText: "Xoá",
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
      width: 60,
      render: (value: string | null) => (
        <Avatar src={value || DEFAULT_AVATAR} size={40} />
      ),
    },
    { title: "Họ và tên", dataIndex: "name" },
    { title: "Chức vụ", dataIndex: "position" },
    { title: "SĐT", dataIndex: "phone" },
    { title: "Phòng ban", dataIndex: "departmentName" },
    { title: "Ngày sinh", dataIndex: "birthday" },
    {
      title: "Tài khoản",
      dataIndex: "role",
      render: (_role: string | null, record: EmployeeResponse) =>
        _role ? (
          <Tag color="green">
            {_role}{" "}
            <EyeOutlined
              style={{ marginLeft: 8, cursor: "pointer" }}
              onClick={() => handleShowUserDetail(record.id)}
            />
          </Tag>
        ) : (
          <Button
            icon={<UserAddOutlined />}
            type="link"
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
      render: (_: any, record: EmployeeResponse) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleShowEmployeeDetail(record.id)}
          >
            Chi tiết
          </Button>
          <Button
            type="link"
            icon={<DeleteOutlined />}
            danger
            onClick={() => handleDeleteEmployee(record.id)}
          >
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full h-full bg-white ">
      {contextHolderModal}
      {contextHolderMessage}

      {/* Header search + filter + add */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Tìm kiếm theo tên, chức vụ..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onPressEnter={() => loadEmployees(searchText, filterDepartmentId)}
          className="flex-1"
        />
        <Select
          placeholder="Chọn phòng ban"
          allowClear
          style={{ width: 200 }}
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
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateEmployeeModal(true)}
        >
          Thêm nhân viên
        </Button>
      </div>

      {/* Employee Table */}
      <Table
        dataSource={employees}
        columns={columns}
        rowKey="id"
        pagination={{ pageSize: 8, total }}
      />

      {/* Modal Thêm nhân viên */}
      <Modal
        title="Thêm nhân viên"
        open={createEmployeeModal}
        okText="Thêm"
        cancelText="Hủy"
        onCancel={() => setCreateEmployeeModal(false)}
        onOk={async () => {
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
            departmentId: values.departmentId,
            avatarFile: null,
          };

          try {
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
        <Form form={formEmployee} layout="horizontal">
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="SĐT" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label="Địa chỉ"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="birthday"
            label="Ngày sinh"
            rules={[{ required: true }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item
            name="gender"
            label="Giới tính"
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="MALE">Nam</Select.Option>
              <Select.Option value="FEMALE">Nữ</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="position"
            label="Chức vụ"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="departmentId"
            label="Phòng ban"
            rules={[{ required: true }]}
          >
            <Select>
              {departments.map((dept) => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chi tiết nhân viên"
        open={employeeDetailModal}
        okText="Lưu"
        cancelText="Hủy"
        width={700}
        onCancel={() => setEmployeeDetailModal(false)}
        onOk={async () => {
          const values = await formEmployeeDetail.validateFields();
          const formData = new FormData();
          Object.entries(values).forEach(([key, value]) => {
            if (
              key === "avatarFile" &&
              Array.isArray(value) &&
              value.length > 0
            ) {
              formData.append(key, value[0].originFileObj);
            } else {
              formData.append(key, value as any);
            }
          });

          formData.append("id", selectedEmployee?.id || "");

          try {
            await employeeApi.updateEmployee(
              formData as unknown as EmployeeRequest
            );
            message.success("Cập nhật nhân viên thành công");
            setEmployeeDetailModal(false);
            loadEmployees();
          } catch {
            message.error("Lỗi cập nhật nhân viên");
          }
        }}
      >
        <Form form={formEmployeeDetail} layout="horizontal" {...formItemLayout}>
          <Form.Item label="" className="flex items-center justify-center">
            <Avatar
              size={80}
              src={selectedEmployee?.keyAvatar || DEFAULT_AVATAR}
            />
          </Form.Item>
          <Form.Item name="name" label="Tên">
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="SĐT">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input />
          </Form.Item>
          <Form.Item name="birthday" label="Ngày sinh">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="gender" label="Giới tính">
            <Select>
              <Select.Option value="MALE">Nam</Select.Option>
              <Select.Option value="FEMALE">Nữ</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="position" label="Chức vụ">
            <Input />
          </Form.Item>
          <Form.Item name="departmentId" label="Phòng ban">
            <Select>
              {departments.map((dept) => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="avatarFile"
            label="Thay đổi Avatar"
            valuePropName="fileList"
            getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}
          >
            <Upload beforeUpload={() => false} maxCount={1} listType="picture">
              <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Chi tiết tài khoản */}
      <Modal
        title={
          selectedUser
            ? `Chi tiết tài khoản: ${selectedUser.username}`
            : "Tạo tài khoản"
        }
        open={userDetailModal}
        okText={selectedUser ? "Lưu" : "Tạo"}
        cancelText="Hủy"
        onCancel={() => setUserDetailModal(false)}
        onOk={handleSaveUserDetail}
        width={500}
      >
        <Form
          form={formUserDetail}
          layout="horizontal"
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
        >
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          {!selectedUser && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="ADMIN">ADMIN</Select.Option>
              <Select.Option value="USER">Người dùng</Select.Option>
              <Select.Option value="MANAGER">Quản lí</Select.Option>
            </Select>
          </Form.Item>
          {selectedUser && (
            <Form.Item name="status" label="Trạng thái">
              <Select>
                <Select.Option value={true}>Hoạt động</Select.Option>
                <Select.Option value={false}>Khóa</Select.Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeePage;
