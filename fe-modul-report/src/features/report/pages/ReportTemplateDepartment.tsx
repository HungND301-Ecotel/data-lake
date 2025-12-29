import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Collapse,
  Table,
  Tag,
  Button,
  Input,
  Modal,
  Form,
  Select,
  Upload,
  message,
  Space,
  Col,
  Row,
} from "antd";
import { UploadOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import type { RcFile } from "antd/es/upload";
import { reportCategoryApi } from "../../category/reportCategory/api/reportCategoryApi";
import type { PageResponse } from "../../department/types/department";
import type { ReportCategoryResponse } from "../types/report";
import type {
  ReportTemplateResponse,
  ReportTemplateRequest,
} from "../types/reportTemplate";
import { reportTemplateApi } from "../api/reportTemplateApi";

const { Panel } = Collapse;
const { Option } = Select;

type ReportGroup = {
  id: string;
  code: string;
  name: string;
  reports: ReportTemplateResponse[];
};

const ReportTemplateDepartment = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const [groups, setGroups] = useState<ReportGroup[]>([]);
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReport, setEditingReport] =
    useState<ReportTemplateResponse | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<RcFile[]>([]);
  const nav = useNavigate();
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [modal, contextHolderModal] = Modal.useModal();

  useEffect(() => {
    if (!departmentId) return;
    const fetchCategories = async () => {
      try {
        const res: PageResponse<ReportCategoryResponse> =
          await reportCategoryApi.searchReportCategory({
            departmentId,
            page: 0,
            limit: 100,
            keyword: searchText,
          });
        const initialGroups: ReportGroup[] = res.content.map((cat) => ({
          id: cat.id,
          code: cat.code,
          name: cat.name,
          reports: [],
        }));
        setGroups(initialGroups);
      } catch (err) {
        console.error(err);
        messageApi.error("Lấy danh sách category thất bại");
      }
    };
    fetchCategories();
  }, [departmentId, searchText]);

  const handleView = (record: ReportTemplateResponse) => {
    const getExtension = (path: string) => {
      if (!path) return "";
      const name = path.split("/").pop() || "";
      return name.split(".").pop()?.toLowerCase() || "";
    };

    if (record.reportId) {
      return nav(`/reports/template/us/${record.reportId}`);
    }

    if (!record.fileKey) {
      return messageApi.error("Chưa có file cho báo cáo này");
    }

    const ext = getExtension(record.fileKey);

    if (ext === "xlsx" || ext === "xls") {
      nav(`/reports/view/excel/${encodeURIComponent(record.fileKey)}`);
    } else if (ext === "pdf") {
      nav(`/reports/view/pdf/${encodeURIComponent(record.fileKey)}`);
    } else if (ext === "doc" || ext === "docx") {
      return messageApi.info("Preview Word đang được phát triển");
    } else {
      messageApi.warning("Không hỗ trợ xem loại file này");
    }
  };

  const handleCategoryClick = async (categoryId: string) => {
    const grpIndex = groups.findIndex((g) => g.id === categoryId);
    if (grpIndex === -1) return;

    try {
      const templates = await reportTemplateApi.getByCategory(categoryId);
      const newGroups = [...groups];
      newGroups[grpIndex].reports = Array.isArray(templates)
        ? templates
        : [templates];
      setGroups(newGroups);
    } catch (err) {
      console.error(err);
      messageApi.error("Lấy danh sách báo cáo thất bại");
    }
  };

  const typeColor = (type?: string) =>
    type === "DYNAMIC" || type === "Động" ? "blue" : "green";

  const handleAddNew = () => {
    setEditingReport(null);
    form.resetFields();
    setFileList([]);
    setModalOpen(true);
  };

  const handleEdit = (report: ReportTemplateResponse) => {
    setEditingReport(report);
    form.setFieldsValue({
      name: report.name,
      description: report.description,
      reportType: report.reportType,
      reportCategoryId: groups.find((g) =>
        g.reports.some((r) => r.id === report.id)
      )?.id,
    });
    setModalOpen(true);
  };

  const handleDelete = (id: string, categoryId: string) => {
    modal.confirm({
      title: "Xác nhận xóa",
      icon: <ExclamationCircleOutlined />,
      content: "Bạn có chắc chắn muốn xóa báo cáo này không?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await reportTemplateApi.deleteReportTemplate(id);
          messageApi.success("Xóa báo cáo thành công");
          handleCategoryClick(categoryId);
        } catch (err) {
          console.error(err);
          messageApi.error("Xóa báo cáo thất bại");
        }
      },
    });
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      let file: File | undefined;
      if (values.reportType === "STATIC" && fileList.length > 0) {
        file = fileList[0] as unknown as File;
      }

      const request: ReportTemplateRequest = {
        name: values.name,
        description: values.description,
        reportType: values.reportType,
        file,
        reportCategoryId: values.reportCategoryId,
        id: editingReport?.id,
      };

      if (editingReport) {
        // await reportTemplateApi.addReportTemplate(request);
        messageApi.success("Cập nhật báo cáo thành công");
      } else {
        await reportTemplateApi.addReportTemplate(request);
        messageApi.success("Thêm báo cáo thành công");
      }

      setModalOpen(false);
      handleCategoryClick(values.reportCategoryId);
    } catch (err) {
      console.error(err);
      messageApi.error("Thao tác thất bại");
    }
  };

  const columns = [
    {
      title: "Tên báo cáo",
      dataIndex: "name",
      key: "name",
      width: 250,
    },
    {
      title: "Người tạo",
      dataIndex: "employeeName",
      key: "employeeName",
      width: 150,
    },
    {
      title: "Loại",
      dataIndex: "reportType",
      key: "reportType",
      width: 120,
      render: (type?: string) => <Tag color={typeColor(type)}>{type}</Tag>,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      render: (_: any, record: ReportTemplateResponse) => (
        <Space>
          <Button size="small" onClick={() => handleView(record)}>
            Xem
          </Button>
          <Button
            size="small"
            onClick={() =>
              (record.reportId &&
                nav(`/reports/template/edit/${record.reportId}`)) ||
              (!record.reportId && handleEdit(record))
            }
          >
            Sửa
          </Button>
          <Button
            size="small"
            danger
            onClick={() =>
              handleDelete(
                record.id!,
                groups.find((g) => g.reports.some((r) => r.id === record.id))
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
    <div>
      {contextHolderMessage}
      {contextHolderModal}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {/* SEARCH */}
        <Col flex="auto">
          <Input
            placeholder="Tìm kiếm báo cáo..."
            value={searchText}
            allowClear
            onChange={(e) => {
              const value = e.target.value;
              setSearchText(value);
            }}
          />
        </Col>

        {/* TYPE FILTER */}
        <Col>
          <Select
            placeholder="Loại báo cáo"
            style={{ width: 160 }}
          >
            <Select.Option value="null">Tất cả</Select.Option>
            <Select.Option value="STATIC">Báo cáo tĩnh</Select.Option>
            <Select.Option value="DYNAMIC">Báo cáo động</Select.Option>
          </Select>
        </Col>

        {/* ADD BUTTON */}
        <Col>
          <Button type="primary" onClick={handleAddNew}>
            + Thêm mới
          </Button>
        </Col>
      </Row>

      {/* Bọc Collapse bằng div có gap */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {groups.map((grp) => (
          <Collapse
            key={grp.id}
            accordion={false}
            style={{
              borderRadius: 8,
              backgroundColor: "#e0f7fa",
              border: "1px solid #d9d9d9",
              overflow: "hidden",
            }}
            onChange={(keys) => {
              if (!keys) return;
              const keyArray = Array.isArray(keys) ? keys : [keys];
              keyArray.forEach((id) => handleCategoryClick(id));
            }}
          >
            <Panel header={`${grp.name} - ${grp.code}`} key={grp.id}>
              <Table
                dataSource={grp.reports}
                columns={columns}
                rowKey="id"
                pagination={false}
                showHeader={false}
              />
            </Panel>
          </Collapse>
        ))}
      </div>

      <Modal
        title={editingReport ? "Sửa báo cáo" : "Thêm báo cáo"}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên báo cáo"
            name="name"
            rules={[{ required: true, message: "Nhập tên báo cáo" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            label="Loại báo cáo"
            name="reportType"
            rules={[{ required: true }]}
          >
            <Select onChange={() => setFileList([])}>
              <Option value="STATIC">Báo cáo tĩnh</Option>
              <Option value="DYNAMIC">Báo cáo động</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Category"
            name="reportCategoryId"
            rules={[{ required: true }]}
          >
            <Select>
              {groups.map((grp) => (
                <Option key={grp.id} value={grp.id}>
                  {grp.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          {form.getFieldValue("reportType") === "STATIC" && (
            <Form.Item
              label="Upload file"
              rules={[
                { required: true, message: "Chọn file cho báo cáo tĩnh" },
              ]}
            >
              <Upload
                beforeUpload={(file) => {
                  setFileList([file]);
                  return false;
                }}
                fileList={fileList as unknown as any[]}
              >
                <Button icon={<UploadOutlined />}>Chọn file</Button>
              </Upload>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default ReportTemplateDepartment;
