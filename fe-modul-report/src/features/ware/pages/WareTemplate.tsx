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
  Col,
  Row,
} from "antd";
import { ExclamationCircleOutlined, AlertOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
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
  const [selectedRecord, setSelectedRecord] = useState<WareTemplateResponse | null>(null);
  // Removed unused state 'pendingAction'

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
          })
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
    setModalOpen(true);
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
      };

      if (editing) {
        await wareTemplateApi.updateWareTemplate(request);
        messageApi.success("Cập nhật thành công");
      } else {
        await wareTemplateApi.saveWareTemplate(request);
        messageApi.success("Thêm mới thành công");
      }

      setModalOpen(false);
      if (values.wareCategoryId) {
        loadTemplatesByCategory(values.wareCategoryId);
      }
    } catch (err) {
      console.error(err);
      messageApi.error("Thao tác thất bại");
    }
  };

  const handleApproveOrInput = (record: WareTemplateResponse, action: "approve" | "input") => {
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

  const canApprove = userRole === "ADMIN" || userRole === "MANAGER";

  const columns: ColumnsType<WareTemplateResponse> = [
    { title: "Mã", dataIndex: "code", width: 140 },
    { title: "Tên", dataIndex: "name", width: 220 },
    { title: "Table", dataIndex: "tableName", width: 200 },
    {
      title: "Thao tác",
      width: canApprove ? 240 : 160,
      render: (_: any, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => nav(`/ware/template/detail/${record.id}`)}
          >
            Cấu hình
          </Button>

          {canApprove ? (
            <Button
              size="small"
              type="primary"
              onClick={() => handleApproveOrInput(record, "approve")}
            >
              Duyệt
            </Button>
          ) : (
            <Button
              size="small"
              onClick={() => handleApproveOrInput(record, "input")}
            >
              Nhập Liệu
            </Button>
          )}
          <Button
            size="small"
            danger
            onClick={() =>
              handleDelete(
                record.id!,
                groups.find((g) => g.templates.some((t) => t.id === record.id))
                  ?.id!
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
    <div className="px-4 py-4 min-h-screen">
      {contextHolderMessage}
      {contextHolderModal}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Input
            placeholder="Tìm kiếm template..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>

        <Col>
          <Button
            type="primary"
            className="bg-[#1a8649]! hover:bg-[#15703d]!"
            onClick={handleAdd}
          >
            + Thêm mới
          </Button>
        </Col>
      </Row>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {groups.map((grp) => (
          <Collapse
            key={grp.id}
            accordion={false}
            style={{
              borderRadius: 8,
              backgroundColor: "#1a8649",
              border: "0px solid #d9d9d9",
              overflow: "hidden",
            }}
            onChange={() => loadTemplatesByCategory(grp.id)}
          >
            <Panel
              header={
                <span className="text-white font-semibold">{grp.name}</span>
              }
              key={grp.id}
            >
              <div className="overflow-auto">
                <Table
                  dataSource={grp.templates}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                  bordered={false}
                  showHeader={false}
                />
              </div>
            </Panel>
          </Collapse>
        ))}
      </div>

      <Modal
        title={editing ? "Sửa template" : "Thêm template"}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="wareCategoryId"
            label="Category"
            rules={[{ required: true }]}
          >
            <Select>
              {groups.map((g) => (
                <Option key={g.id} value={g.id}>
                  {g.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="tableName" label="Table name">
            <Input />
          </Form.Item>

          <Form.Item name="tableCode" label="Table code">
            <Input />
          </Form.Item>

          <Form.Item name="startRow" label="Bắt đầu">
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AlertOutlined style={{ color: "#faad14", fontSize: 20 }} />
            <span>Cấu hình chưa hoàn thành</span>
          </div>
        }
        open={configCheckModal}
        onCancel={() => {
          setConfigCheckModal(false);
          setSelectedRecord(null);
        }}
        footer={null}
        centered
        width={450}
      >
        <div style={{ padding: "20px 0" }}>
          <div
            style={{
              backgroundColor: "#fef7e0",
              border: "1px solid #ffe58f",
              borderRadius: 8,
              padding: 16,
              marginBottom: 24,
              display: "flex",
              gap: 12,
            }}
          >
            <AlertOutlined style={{ color: "#faad14", fontSize: 18, flexShrink: 0 }} />
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: "#000" }}>
                Bảng này chưa có cấu hình người duyệt
              </p>
              <p style={{ margin: "8px 0 0 0", color: "#666", fontSize: 14 }}>
                Vui lòng chọn cấu hình để xác định người duyệt cho bảng này.
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#f0f7ff",
              border: "1px solid #91caff",
              borderRadius: 8,
              padding: 12,
              marginBottom: 24,
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: "#0050b3 " }}>
              <CheckCircleOutlined style={{ marginRight: 6 }} />
              Hãy vào phần <strong>Cấu hình</strong> để thiết lập thông tin cần thiết
            </p>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <Button
              onClick={() => {
                setConfigCheckModal(false);
                setSelectedRecord(null);
              }}
              style={{ flex: 1 }}
            >
              Huỷ
            </Button>
            <Button
              type="primary"
              onClick={handleGoToConfig}
              style={{ flex: 1, backgroundColor: "#1a8649" }}
            >
              Đi tới cấu hình
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WareTemplate;