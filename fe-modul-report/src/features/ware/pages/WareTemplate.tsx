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
import { ExclamationCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { wareTemplateApi } from "../api/wareTemplateApi";
import { wareCategoryApi } from "../api/wareCategoryApi";
import type {
  WareTemplateResponse,
  WareTemplateRequest,
} from "../types/wareTemplate";
import type { WareCategoryResponse } from "../types/wareCategory";
import { useNavigate, useParams } from "react-router-dom";

const { Panel } = Collapse;
const { Option } = Select;

type WareTemplateGroup = {
  id: number;
  code: string;
  name: string;
  templates: WareTemplateResponse[];
};

const WareTemplate = () => {
  const [groups, setGroups] = useState<WareTemplateGroup[]>([]);
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<WareTemplateResponse | null>(null);
  const [form] = Form.useForm();
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [modal, contextHolderModal] = Modal.useModal();
  const { departmentId } = useParams<{ departmentId: string }>();
  const nav = useNavigate();

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

  const columns: ColumnsType<WareTemplateResponse> = [
    { title: "Mã", dataIndex: "code", width: 140 },
    { title: "Tên", dataIndex: "name", width: 220 },
    { title: "Table", dataIndex: "tableName", width: 200 },
    {
      title: "Thao tác",
      width: 160,
      render: (_: any, record) => (
        <Space>
          <Button
            size="small"
            onClick={() => nav(`/ware/template/detail/${record.id}`)}
          >
            Cấu hình
          </Button>
          <Button
            size="small"
            onClick={() => nav(`/ware/template/${record.id}`)}
          >
            Nhập Liệu
          </Button>
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
          <Button type="primary" className="bg-[#1a8649]! hover:bg-[#15703d]!" onClick={handleAdd}>
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
                <span className="text-white font-semibold">
                  {grp.name}
                </span>
              }
              key={grp.id}
            >
              <Table
                dataSource={grp.templates}
                columns={columns}
                rowKey="id"
                pagination={false}
                bordered={false}
                showHeader={false}
              />
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
    </div>
  );
};

export default WareTemplate;
