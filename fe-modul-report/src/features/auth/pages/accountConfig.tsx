import { useEffect, useState } from "react";
import {
    Card,
    Button,
    Form,
    Input,
    Checkbox,
    message,
    Empty,
    Descriptions,
    Tag,
    Alert,
} from "antd";
import {
    PlusOutlined,
    EditOutlined,
    LockOutlined,
    UserOutlined,
    WarningOutlined,
    DeleteOutlined,
} from "@ant-design/icons";
import { userPushApi } from "../api/accountConfigApi";
import type { UserPushRequest, UserPushResponse } from "../types/accountConfig";
import { jwtDecode } from "jwt-decode";
import { Modal } from "antd";

type DecodedToken = {
    role: string;
    [key: string]: any;
};

const UserPushConfigPage = () => {
    const [userPushConfig, setUserPushConfig] = useState<UserPushResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [savePassword, setSavePassword] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [deleteVisible, setDeleteVisible] = useState(false);

    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();

    // ✅ Gọi TẤT CẢ hooks trước
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode<DecodedToken>(token);
                setUserRole(decoded.role);
                console.log("Retrieved token:", decoded.role);
            } catch (err) {
                console.error("Error decoding token:", err);
            }
        }
    }, []);

    const loadUserPushConfig = async () => {
        try {
            setLoading(true);
            const res = await userPushApi.getAllUserPush();
            if (res && res.length > 0) {
                setUserPushConfig(res[0]);
            } else {
                setUserPushConfig(null);
            }
        } catch (error) {
            console.log(error);
            setUserPushConfig(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserPushConfig();
    }, []);

    // ✅ Kiểm tra quyền SAU khi đã gọi tất cả hooks
    if (userRole !== "ADMIN") {
        return (
            <div className="px-6 py-6 bg-linear-to-br from-gray-50 to-gray-100">
                {contextHolder}
                <Card className="shadow-lg border-0 rounded-xl max-w-2xl mx-auto mt-20">
                    <div className="text-center py-12">
                        <WarningOutlined className="text-6xl text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            Không có quyền truy cập
                        </h2>
                        <p className="text-gray-600">
                            Bạn không có quyền truy cập vào trang này. Chỉ ADMIN mới có thể cấu hình tài khoản.
                        </p>
                    </div>
                </Card>
            </div>
        );
    }
    const handleOpenModal = (edit: boolean) => {
        setIsEdit(edit);
        if (edit && userPushConfig) {
            form.setFieldsValue({
                username: userPushConfig.username,
                password: userPushConfig.password || "",
            });
            setSavePassword(!!userPushConfig.password);
        } else {
            form.resetFields();
            setSavePassword(false);
        }
        setModalVisible(true);
    };

    const handleSave = async () => {
        try {
            await form.validateFields();

            const username = form.getFieldValue("username");

            const request: UserPushRequest = {
                username,
                password: savePassword
                    ? form.getFieldValue("password") || ""
                    : "",
            };

            console.log("FINAL REQUEST:", request);

            if (isEdit && userPushConfig) {
                await userPushApi.updateUserPush(userPushConfig.id, request);
                messageApi.success("Cập nhật tài khoản thành công");
            } else {
                await userPushApi.createUserPush(request);
                messageApi.success("Thêm tài khoản thành công");
            }

            setModalVisible(false);
            form.resetFields();
            setSavePassword(false);
            loadUserPushConfig();
        } catch (error) {
            console.log(error);
            messageApi.error(isEdit ? "Lỗi cập nhật" : "Lỗi thêm");
        }
    };

    return (
        <div className="px-6 py-6 bg-linear-to-br">
            {contextHolder}

            <Card className="shadow-lg border-0 rounded-xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100">
                                <LockOutlined className="text-blue-600 text-lg" />
                            </div>
                            Cấu hình tài khoản TKV
                        </h1>
                        <p className="text-gray-500 mt-1 ml-13">
                            Quản lý tài khoản để đồng bộ dữ liệu
                        </p>
                    </div>

                    {!userPushConfig && !loading && (
                        <Button
                            type="primary"
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={() => handleOpenModal(false)}
                            className="bg-[#0891b2]! hover:bg-cyan-7000! border-0 shadow-md"
                            style={{ borderRadius: "8px" }}
                        >
                            Thêm tài khoản
                        </Button>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-500 mt-4">Đang tải...</p>
                    </div>
                ) : userPushConfig ? (
                    <div>
                        <Alert
                            message="Tài khoản đã được cấu hình"
                            description="Hệ thống đã có tài khoản cấu hình để đồng bộ dữ liệu. Bạn có thể chỉnh sửa thông tin nếu cần."
                            type="success"
                            showIcon
                            className="mb-6 rounded-lg"
                        />

                        <Card className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-100">
                            <Descriptions column={1} labelStyle={{ fontWeight: 600, color: "#374151" }}>
                                <Descriptions.Item
                                    label={
                                        <span className="flex items-center gap-2">
                                            <UserOutlined className="text-blue-500" />
                                            Tên đăng nhập
                                        </span>
                                    }
                                >
                                    <Tag color="green" className="px-3 py-1 text-base">
                                        {userPushConfig.username}
                                    </Tag>
                                </Descriptions.Item>

                                <Descriptions.Item
                                    label={
                                        <span className="flex items-center gap-2">
                                            <LockOutlined className="text-blue-500" />
                                            Mật khẩu
                                        </span>
                                    }
                                >
                                    {userPushConfig.password ? (
                                        <span className="text-gray-700 font-mono bg-gray-100 px-3 py-1 rounded">
                                            {userPushConfig.password}
                                        </span>
                                    ) : (
                                        <Tag color="orange" className="px-3 py-1">
                                            Không lưu mật khẩu
                                        </Tag>
                                    )}
                                </Descriptions.Item>
                            </Descriptions>

                            <div className="mt-6 pt-4 border-t border-blue-200 flex gap-1">
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => handleOpenModal(true)}
                                    size="large"
                                    className="bg-blue-600! hover:bg-blue-700! border-0"
                                    style={{ borderRadius: "8px" }}
                                >
                                    Chỉnh sửa
                                </Button>
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => setDeleteVisible(true)}
                                    size="large"
                                >
                                    Xóa
                                </Button>
                            </div>
                        </Card>
                    </div>
                ) : (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <div className="py-8">
                                <p className="text-gray-600 text-lg mb-2">
                                    Chưa có tài khoản cấu hình
                                </p>
                                <p className="text-gray-400 text-sm">
                                    Vui lòng thêm tài khoản để bắt đầu đồng bộ dữ liệu
                                </p>
                            </div>
                        }
                    />
                )}
            </Card>

            {/* Modal Thêm/Sửa */}
            <Modal
                title={
                    <div className="flex items-center gap-3 pb-3 border-b">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${isEdit ? "bg-blue-100" : "bg-green-100"
                                }`}
                        >
                            {isEdit ? (
                                <EditOutlined className="text-blue-600 text-lg" />
                            ) : (
                                <PlusOutlined className="text-green-600 text-lg" />
                            )}
                        </div>
                        <div className="text-lg font-semibold text-gray-800">
                            {isEdit ? "Chỉnh sửa tài khoản" : "Thêm tài khoản cấu hình"}
                        </div>
                    </div>
                }
                open={modalVisible}
                okText={isEdit ? "Cập nhật" : "Thêm"}
                cancelText="Hủy"
                width={600}
                onCancel={() => {
                    setModalVisible(false);
                    form.resetFields();
                }}
                onOk={handleSave}
                okButtonProps={{
                    className:
                        "bg-[#0891b2]! hover:bg-cyan-7000! text-white! border-0 h-10 px-6 text-base font-medium",
                    size: "large",
                }}
                cancelButtonProps={{
                    size: "large",
                    className: "h-10 px-6 text-base",
                }}
            >
                <Form form={form} layout="vertical" className="mt-6">
                    <Form.Item
                        name="username"
                        label={
                            <span className="font-medium text-gray-700">
                                Tên đăng nhập <span className="text-red-500">*</span>
                            </span>
                        }
                        rules={[{ required: true, message: "Vui lòng nhập tên đăng nhập" }]}
                    >
                        <Input
                            prefix={<UserOutlined className="text-gray-400" />}
                            placeholder="Nhập tên đăng nhập"
                            size="large"
                            className="rounded-lg"
                        />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label={
                            <span className="font-medium text-gray-700">
                                Mật khẩu {savePassword && <span className="text-red-500">*</span>}
                            </span>
                        }
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder={savePassword ? "Nhập mật khẩu" : "Không lưu mật khẩu"}
                            size="large"
                            className="rounded-lg"
                        />
                    </Form.Item>

                    <Form.Item>
                        <Checkbox
                            checked={savePassword}
                            onChange={(e) => {
                                setSavePassword(e.target.checked);
                                // Nếu bỏ tick thì clear password field
                                if (!e.target.checked) {
                                    form.setFieldValue('password', '');
                                }
                            }}
                            className="text-gray-700"
                        >
                            <span className="font-medium">Lưu mật khẩu</span>
                            <p className="text-gray-500 text-sm ml-6 mt-1">
                                Nếu không chọn, mật khẩu sẽ không được lưu trữ trên hệ thống
                            </p>
                        </Checkbox>
                    </Form.Item>

                    {!savePassword && (
                        <Alert
                            message="Lưu ý"
                            description="Mật khẩu sẽ không được lưu. Bạn sẽ cần nhập lại mật khẩu mỗi khi thực hiện đồng bộ."
                            type="warning"
                            showIcon
                            className="rounded-lg"
                        />
                    )}
                </Form>
            </Modal>

            <Modal
                open={deleteVisible}
                title="Xác nhận xóa"
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
                onCancel={() => setDeleteVisible(false)}
                onOk={async () => {
                    try {
                        await userPushApi.deleteUserPush(userPushConfig!.id);
                        messageApi.success("Xóa tài khoản thành công");
                        setDeleteVisible(false);
                        loadUserPushConfig();
                    } catch (e) {
                        messageApi.error("Lỗi xóa tài khoản");
                    }
                }}
            >
                Bạn có chắc chắn muốn xóa tài khoản cấu hình này?
            </Modal>

            <style>{`
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
        .ant-input-affix-wrapper {
          transition: all 0.3s ease;
        }
        .ant-input:focus,
        .ant-input-affix-wrapper:focus,
        .ant-input-affix-wrapper-focused {
          border-color: #1a8649;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }
        .bg-gradient-to-br {
          background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
        }
        .bg-gradient-to-r {
          background: linear-gradient(to right, #eff6ff, #eef2ff);
        }
        .ml-13 {
          margin-left: 3.25rem;
        }
      `}</style>
        </div>
    );
};

export default UserPushConfigPage;