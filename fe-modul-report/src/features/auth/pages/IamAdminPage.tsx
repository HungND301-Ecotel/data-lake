import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import iamApi, {
  type AccessReviewItem,
  type AccessReviewLine,
  type OrganizationItem,
  type PermissionItem,
  type RoleItem,
  type ServiceAccountItem,
  type UserAccess,
} from "../api/iamApi";

const { Text, Paragraph } = Typography;

/** Nhãn mức độ mật, khớp danh mục seed của worker (miền A/B/C - mục 9.1). */
const CLEARANCE_LABELS = [
  { value: 0, label: "0 · Công khai (miền A)" },
  { value: 1, label: "1 · Nội bộ (miền A)" },
  { value: 2, label: "2 · Hạn chế (miền B)" },
  { value: 3, label: "3 · Mật (miền C)" },
  { value: 4, label: "4 · Tối mật (miền C)" },
];

function formatTime(value?: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "—";
}

export default function IamAdminPage() {
  const [users, setUsers] = useState<UserAccess[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [serviceAccounts, setServiceAccounts] = useState<ServiceAccountItem[]>([]);
  const [reviews, setReviews] = useState<AccessReviewItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState<UserAccess | null>(null);
  const [reviewLines, setReviewLines] = useState<AccessReviewLine[] | null>(null);
  const [openReviewId, setOpenReviewId] = useState<string | null>(null);
  const [newSecret, setNewSecret] = useState<{ clientId: string; clientSecret: string } | null>(null);
  const [serviceForm] = Form.useForm();
  const [serviceModalOpen, setServiceModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, r, p, o, s, rv] = await Promise.all([
        iamApi.listUsers(),
        iamApi.listRoles(),
        iamApi.listPermissions(),
        iamApi.listOrganizations(),
        iamApi.listServiceAccounts(),
        iamApi.listAccessReviews(),
      ]);
      setUsers(u.items);
      setRoles(r.items);
      setPermissions(p.items);
      setOrganizations(o.items);
      setServiceAccounts(s.items);
      setReviews(rv.items);
    } catch {
      // axiosClient đã hiển thị thông báo lỗi
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openReviewItems = async (reviewId: string) => {
    setOpenReviewId(reviewId);
    setReviewLines((await iamApi.accessReviewItems(reviewId)).items);
  };

  const decide = async (line: AccessReviewLine, decision: "KEEP" | "REVOKE") => {
    let reason = "";
    if (decision === "REVOKE") {
      reason = window.prompt("Lý do thu hồi (bắt buộc)") || "";
      if (!reason.trim()) {
        message.warning("Thu hồi quyền phải kèm lý do");
        return;
      }
    }
    await iamApi.decideAccessReviewItem(line.id, decision, reason);
    message.success("Đã ghi nhận quyết định");
    if (openReviewId) await openReviewItems(openReviewId);
    load();
  };

  return (
    <div className="space-y-4">
      <Card
        title="Quản trị danh tính và phân quyền"
        extra={
          <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
            Làm mới
          </Button>
        }
      >
        <Tabs
          items={[
            {
              key: "users",
              label: `Người dùng (${users.length})`,
              children: (
                <Table
                  rowKey="userId"
                  size="small"
                  loading={loading}
                  dataSource={users}
                  columns={[
                    { title: "Tài khoản", dataIndex: "username", width: 160 },
                    {
                      title: "Vai trò",
                      dataIndex: "roles",
                      render: (value: string[]) =>
                        value.length ? (
                          <Space wrap size={[4, 4]}>
                            {value.map((code) => (
                              <Tag key={code} color="blue">
                                {code}
                              </Tag>
                            ))}
                          </Space>
                        ) : (
                          <Text type="secondary">—</Text>
                        ),
                    },
                    { title: "Đơn vị", dataIndex: "orgCode", width: 130 },
                    {
                      title: "Mức độ mật",
                      key: "clearance",
                      width: 150,
                      render: (_, row) => (
                        <Tooltip title="Mức được cấp / mức hiệu lực sau khi chặn theo trần của vai trò">
                          <Tag color={(row.effectiveClearanceLevel ?? 0) >= 3 ? "red" : "gold"}>
                            {row.clearanceLevel ?? 0} → {row.effectiveClearanceLevel ?? 0}
                          </Tag>
                        </Tooltip>
                      ),
                    },
                    {
                      title: "MFA",
                      dataIndex: "mfaEnabled",
                      width: 90,
                      render: (value: boolean) =>
                        value ? <Tag color="green">Bật</Tag> : <Tag>Tắt</Tag>,
                    },
                    {
                      title: "Trạng thái",
                      key: "status",
                      width: 130,
                      render: (_, row) =>
                        row.revokedAt ? (
                          <Tag color="red">Đã thu hồi</Tag>
                        ) : row.lockedUntil && new Date(row.lockedUntil) > new Date() ? (
                          <Tag color="orange">Đang khoá</Tag>
                        ) : (
                          <Tag color="green">Hoạt động</Tag>
                        ),
                    },
                    {
                      title: "Đăng nhập gần nhất",
                      dataIndex: "lastLoginAt",
                      width: 170,
                      render: formatTime,
                    },
                    {
                      title: "",
                      key: "action",
                      width: 180,
                      render: (_, row) => (
                        <Space>
                          <Button size="small" onClick={() => setEditing(row)}>
                            Phân quyền
                          </Button>
                          {row.revokedAt ? (
                            <Popconfirm
                              title="Khôi phục tài khoản?"
                              onConfirm={async () => {
                                await iamApi.reinstateUser(row.userId, "Khôi phục từ giao diện quản trị");
                                message.success("Đã khôi phục");
                                load();
                              }}
                            >
                              <Button size="small">Khôi phục</Button>
                            </Popconfirm>
                          ) : (
                            <Popconfirm
                              title="Thu hồi quyền truy cập? Mọi phiên hiện tại sẽ mất hiệu lực ngay."
                              onConfirm={async () => {
                                await iamApi.revokeUser(row.userId, "Thu hồi từ giao diện quản trị");
                                message.success("Đã thu hồi");
                                load();
                              }}
                            >
                              <Button size="small" danger>
                                Thu hồi
                              </Button>
                            </Popconfirm>
                          )}
                        </Space>
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: "roles",
              label: `Vai trò (${roles.length})`,
              children: (
                <Table
                  rowKey="id"
                  size="small"
                  loading={loading}
                  dataSource={roles}
                  columns={[
                    { title: "Mã", dataIndex: "code", width: 180 },
                    { title: "Tên", dataIndex: "name", width: 200 },
                    {
                      title: "Trần mức độ mật",
                      dataIndex: "maxClearanceLevel",
                      width: 140,
                      render: (value: number) => <Tag>{value}</Tag>,
                    },
                    {
                      title: "Đọc chéo đơn vị",
                      dataIndex: "crossOrg",
                      width: 140,
                      render: (value: boolean) =>
                        value ? <Tag color="orange">Có</Tag> : <Tag>Không</Tag>,
                    },
                    {
                      title: "Loại",
                      dataIndex: "systemRole",
                      width: 120,
                      render: (value: boolean) =>
                        value ? <Tag color="purple">Hệ thống</Tag> : <Tag>Tuỳ biến</Tag>,
                    },
                    {
                      title: "Quyền",
                      dataIndex: "permissions",
                      render: (value: string[]) => (
                        <Space wrap size={[4, 4]}>
                          {value.map((code) => (
                            <Tag key={code}>{code}</Tag>
                          ))}
                        </Space>
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: "permissions",
              label: `Quyền (${permissions.length})`,
              children: (
                <Table
                  rowKey="code"
                  size="small"
                  pagination={false}
                  dataSource={permissions}
                  columns={[
                    { title: "Mã", dataIndex: "code", width: 220 },
                    { title: "Tên", dataIndex: "name" },
                    { title: "Nhóm", dataIndex: "category", width: 220 },
                  ]}
                />
              ),
            },
            {
              key: "service-accounts",
              label: `Service account (${serviceAccounts.length})`,
              children: (
                <>
                  <Space className="mb-3">
                    <Button type="primary" onClick={() => setServiceModalOpen(true)}>
                      Tạo service account
                    </Button>
                  </Space>
                  <Table
                    rowKey="id"
                    size="small"
                    loading={loading}
                    dataSource={serviceAccounts}
                    columns={[
                      { title: "Client ID", dataIndex: "clientId", width: 220 },
                      { title: "Tên", dataIndex: "name" },
                      { title: "Đơn vị", dataIndex: "orgCode", width: 130 },
                      {
                        title: "Vai trò",
                        dataIndex: "roles",
                        render: (value: string[]) => value.join(", "),
                      },
                      {
                        title: "Trạng thái",
                        dataIndex: "active",
                        width: 120,
                        render: (value: boolean) =>
                          value ? <Tag color="green">Hoạt động</Tag> : <Tag color="red">Đã thu hồi</Tag>,
                      },
                      { title: "Hết hạn", dataIndex: "expiresAt", width: 170, render: formatTime },
                      { title: "Dùng gần nhất", dataIndex: "lastUsedAt", width: 170, render: formatTime },
                      {
                        title: "",
                        key: "action",
                        width: 200,
                        render: (_, row) => (
                          <Space>
                            <Popconfirm
                              title="Xoay vòng secret? Secret cũ sẽ hết hiệu lực ngay."
                              onConfirm={async () => {
                                setNewSecret(await iamApi.rotateServiceAccountSecret(row.id));
                                load();
                              }}
                            >
                              <Button size="small">Xoay secret</Button>
                            </Popconfirm>
                            {row.active && (
                              <Popconfirm
                                title="Thu hồi service account?"
                                onConfirm={async () => {
                                  await iamApi.revokeServiceAccount(row.id, "Thu hồi từ giao diện quản trị");
                                  message.success("Đã thu hồi");
                                  load();
                                }}
                              >
                                <Button size="small" danger>
                                  Thu hồi
                                </Button>
                              </Popconfirm>
                            )}
                          </Space>
                        ),
                      },
                    ]}
                  />
                </>
              ),
            },
            {
              key: "reviews",
              label: `Rà soát quyền (${reviews.length})`,
              children: (
                <>
                  <Space className="mb-3">
                    <Button
                      type="primary"
                      onClick={async () => {
                        const name = window.prompt(
                          "Tên đợt rà soát",
                          `Rà soát quyền ${new Date().toLocaleDateString("vi-VN")}`
                        );
                        if (!name) return;
                        await iamApi.openAccessReview({ name });
                        message.success("Đã mở đợt rà soát");
                        load();
                      }}
                    >
                      Mở đợt rà soát
                    </Button>
                  </Space>
                  <Table
                    rowKey="id"
                    size="small"
                    loading={loading}
                    dataSource={reviews}
                    columns={[
                      { title: "Tên", dataIndex: "name" },
                      { title: "Phạm vi", dataIndex: "scopeOrgCode", width: 130, render: (v) => v || "Toàn bộ" },
                      {
                        title: "Trạng thái",
                        dataIndex: "status",
                        width: 130,
                        render: (value: string) => (
                          <Tag color={value === "COMPLETED" ? "green" : "processing"}>{value}</Tag>
                        ),
                      },
                      {
                        title: "Tiến độ",
                        key: "progress",
                        width: 140,
                        render: (_, row) => `${row.totalItems - row.pendingItems}/${row.totalItems}`,
                      },
                      { title: "Mở lúc", dataIndex: "createdAt", width: 170, render: formatTime },
                      {
                        title: "",
                        key: "action",
                        width: 200,
                        render: (_, row) => (
                          <Space>
                            <Button size="small" onClick={() => openReviewItems(row.id)}>
                              Xem mục
                            </Button>
                            {row.status !== "COMPLETED" && row.pendingItems === 0 && (
                              <Button
                                size="small"
                                type="primary"
                                onClick={async () => {
                                  await iamApi.completeAccessReview(row.id);
                                  message.success("Đã kết thúc đợt rà soát");
                                  load();
                                }}
                              >
                                Kết thúc
                              </Button>
                            )}
                          </Space>
                        ),
                      },
                    ]}
                  />
                </>
              ),
            },
          ]}
        />
      </Card>

      <UserAccessModal
        user={editing}
        roles={roles}
        organizations={organizations}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />

      <Modal
        title="Tạo service account"
        open={serviceModalOpen}
        onCancel={() => setServiceModalOpen(false)}
        onOk={async () => {
          const values = await serviceForm.validateFields();
          const created = await iamApi.createServiceAccount(values);
          setNewSecret(created);
          setServiceModalOpen(false);
          serviceForm.resetFields();
          load();
        }}
      >
        <Form form={serviceForm} layout="vertical">
          <Form.Item name="clientId" label="Client ID" rules={[{ required: true }]}>
            <Input placeholder="vd: lakehouse-worker" />
          </Form.Item>
          <Form.Item name="name" label="Tên hiển thị" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="orgCode" label="Đơn vị">
            <Select
              allowClear
              options={organizations.map((o) => ({ value: o.code, label: `${o.name} (${o.code})` }))}
            />
          </Form.Item>
          <Form.Item name="clearanceLevel" label="Mức độ mật" initialValue={0}>
            <Select options={CLEARANCE_LABELS} />
          </Form.Item>
          <Form.Item name="roleCodes" label="Vai trò" rules={[{ required: true }]}>
            <Select
              mode="multiple"
              options={roles.map((r) => ({ value: r.code, label: `${r.code} — ${r.name}` }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Client secret"
        open={Boolean(newSecret)}
        onCancel={() => setNewSecret(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setNewSecret(null)}>
            Tôi đã lưu lại
          </Button>,
        ]}
      >
        <Alert
          type="warning"
          showIcon
          className="mb-3"
          message="Secret chỉ hiển thị một lần"
          description="Hệ thống chỉ lưu bản băm. Nếu làm mất, phải xoay vòng để lấy secret mới."
        />
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Client ID">{newSecret?.clientId}</Descriptions.Item>
          <Descriptions.Item label="Client secret">
            <Paragraph copyable className="m-0 break-all">
              {newSecret?.clientSecret}
            </Paragraph>
          </Descriptions.Item>
        </Descriptions>
      </Modal>

      <Modal
        title="Các mục cần quyết định"
        open={Boolean(reviewLines)}
        width={900}
        onCancel={() => {
          setReviewLines(null);
          setOpenReviewId(null);
        }}
        footer={null}
      >
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={reviewLines ?? []}
          columns={[
            { title: "Tài khoản", dataIndex: "username", width: 160 },
            { title: "Đơn vị", dataIndex: "orgCode", width: 120 },
            { title: "Vai trò", dataIndex: "roleCode", width: 170 },
            { title: "Mức độ mật", dataIndex: "clearanceLevel", width: 110 },
            {
              title: "Quyết định",
              dataIndex: "decision",
              width: 120,
              render: (value: string) => (
                <Tag color={value === "REVOKE" ? "red" : value === "KEEP" ? "green" : "default"}>
                  {value}
                </Tag>
              ),
            },
            {
              title: "",
              key: "action",
              width: 180,
              render: (_, row) =>
                row.decision === "PENDING" ? (
                  <Space>
                    <Button size="small" onClick={() => decide(row, "KEEP")}>
                      Giữ
                    </Button>
                    <Button size="small" danger onClick={() => decide(row, "REVOKE")}>
                      Thu hồi
                    </Button>
                  </Space>
                ) : null,
            },
          ]}
        />
      </Modal>
    </div>
  );
}

function UserAccessModal({
  user,
  roles,
  organizations,
  onClose,
  onSaved,
}: {
  user: UserAccess | null;
  roles: RoleItem[];
  organizations: OrganizationItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        roleCodes: user.roles,
        orgCode: user.orgCode,
        clearanceLevel: user.clearanceLevel ?? 0,
        reason: "",
      });
    }
  }, [user, form]);

  const save = async () => {
    if (!user) return;
    const values = await form.validateFields();
    setSaving(true);
    try {
      // Mỗi thay đổi là một sự kiện audit riêng nên gọi tuần tự theo từng loại.
      if (JSON.stringify(values.roleCodes) !== JSON.stringify(user.roles)) {
        await iamApi.assignRoles(user.userId, values.roleCodes, values.reason);
      }
      if (values.orgCode !== user.orgCode) {
        await iamApi.setOrganization(user.userId, values.orgCode, values.reason);
      }
      if (values.clearanceLevel !== (user.clearanceLevel ?? 0)) {
        await iamApi.setClearance(user.userId, values.clearanceLevel, values.reason);
      }
      message.success("Đã cập nhật. Các phiên hiện tại của người dùng đã mất hiệu lực.");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Phân quyền · ${user?.username ?? ""}`}
      open={Boolean(user)}
      onCancel={onClose}
      onOk={save}
      confirmLoading={saving}
      width={620}
    >
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message="Mọi thay đổi sẽ vô hiệu hoá token đang lưu hành của người dùng và được ghi vào nhật ký kiểm toán."
      />
      <Form form={form} layout="vertical">
        <Form.Item name="roleCodes" label="Vai trò">
          <Select
            mode="multiple"
            options={roles.map((r) => ({ value: r.code, label: `${r.code} — ${r.name}` }))}
          />
        </Form.Item>
        <Form.Item name="orgCode" label="Đơn vị sở hữu">
          <Select
            allowClear
            options={organizations.map((o) => ({ value: o.code, label: `${o.name} (${o.code})` }))}
          />
        </Form.Item>
        <Form.Item
          name="clearanceLevel"
          label="Mức độ mật được cấp"
          extra="Mức hiệu lực còn bị chặn bởi trần của các vai trò được gán"
        >
          <Select options={CLEARANCE_LABELS} />
        </Form.Item>
        <Form.Item
          name="reason"
          label="Lý do thay đổi"
          rules={[{ required: true, message: "Nhập lý do để lưu vào nhật ký kiểm toán" }]}
        >
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

