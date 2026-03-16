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
import { ExclamationCircleOutlined, UploadOutlined } from "@ant-design/icons";
import type { RcFile } from "antd/es/upload";
import type { PageResponse } from "../../department/types/department";
import type {
  ReportStorageRequest,
  ReportStorageResponse,
  ReportStorageSearch,
} from "../types/reportStorage";
import { reportCategoryApi } from "../../category/reportCategory/api/reportCategoryApi";
import { reportStorageApi } from "../api/reportStorageApi";

const { Panel } = Collapse;
const { Option } = Select;

type ReportGroup = {
  id: string;
  code: string;
  name: string;
  reports: PageResponse<ReportStorageResponse> | null;
};

const ReportStorageDepartment = () => {
  const { departmentId } = useParams<{ departmentId: string }>();
  const [groups, setGroups] = useState<ReportGroup[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReport, setEditingReport] =
    useState<ReportStorageResponse | null>(null);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<RcFile[]>([]);
  const nav = useNavigate();
  const [messageApi, contextHolderMessage] = message.useMessage();
  const [modal, contextHolderModal] = Modal.useModal();

  useEffect(() => {
    if (!departmentId) return;

    const fetchCategories = async () => {
      try {
        const res: PageResponse<{ id: string; code: string; name: string }> =
          await reportCategoryApi.searchReportCategory({
            departmentId,
            page: 0,
            limit: 100,
          });
        const initialGroups: ReportGroup[] = res.content.map((cat) => ({
          id: cat.id,
          code: cat.code,
          name: cat.name,
          reports: null,
        }));
        setGroups(initialGroups);
      } catch (err) {
        console.error(err);
        messageApi.error("Lấy danh sách category thất bại");
      }
    };
    fetchCategories();
  }, [departmentId, messageApi]);

  useEffect(() => {
    if (groups.length === 0) return;

    groups.forEach((grp) => {
      fetchReports(grp.id, searchText, 0, 10, statusFilter);
    });
  }, [groups]);

  const fetchReports = async (
    categoryId: string,
    keyword = "",
    page = 0,
    limit = 10,
    status = "ALL"
  ) => {
    const grpIndex = groups.findIndex((g) => g.id === categoryId);
    if (grpIndex === -1) return;
    try {
      const params: ReportStorageSearch = {
        reportCategoryId: categoryId,
        keyword,
        page,
        limit,
        status: status === "" ? null : status,
      };
      const res = await reportStorageApi.searchReportStorage(params);
      const newGroups = [...groups];
      newGroups[grpIndex].reports = res;
      setGroups(newGroups);
    } catch (err) {
      console.error(err);
      messageApi.error("Lấy danh sách báo cáo thất bại");
    }
  };

  // 3. Cập nhật báo cáo khi search hoặc filter status
  const updateReports = (keyword: string, status: string) => {
    groups.forEach((grp) => fetchReports(grp.id, keyword, 0, 10, status));
  };

  const handleView = (record: ReportStorageResponse) => {
    const getExtension = (path: string) => {
      if (!path) return "";
      const name = path.split("/").pop() || "";
      return name.split(".").pop()?.toLowerCase() || "";
    };

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

  // 4. Thêm / sửa
  const handleAddNew = () => {
    setEditingReport(null);
    form.resetFields();
    setFileList([]);
    setModalOpen(true);
  };

  const handleEdit = (report: ReportStorageResponse) => {
    setEditingReport(report);
    form.setFieldsValue({
      name: report.name,
      description: report.description,
      note: report.note,
      reportCategoryId: groups.find((g) =>
        g.reports?.content.some((r) => r.id === report.id)
      )?.id,
    });
    setModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const file = fileList[0] as unknown as File;

      const request: ReportStorageRequest = {
        name: values.name,
        description: values.description,
        note: values.note,
        file,
        reportCategoryId: values.reportCategoryId,
        id: editingReport?.id,
      };

      await reportStorageApi.addReportStorage(request);

      messageApi.success(
        editingReport
          ? "Cập nhật báo cáo thành công"
          : "Thêm báo cáo thành công"
      );
      setModalOpen(false);
      fetchReports(values.reportCategoryId, searchText, 0, 10, statusFilter);
    } catch (err) {
      console.error(err);
      messageApi.error("Thao tác thất bại");
    }
  };

  // 5. Xóa với confirm
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
          await reportStorageApi.deleteReportStorage(id);
          messageApi.success("Xóa báo cáo thành công");
          fetchReports(categoryId, searchText, 0, 10, statusFilter);
        } catch (err) {
          console.error(err);
          messageApi.error("Xóa báo cáo thất bại");
        }
      },
    });
  };

  const columns = (categoryId: string) => [
    {
      title: "Tên báo cáo",
      dataIndex: "name",
      key: "name",
      render: (_: any, record: ReportStorageResponse) => {
        const ext = record.fileKey?.split(".").pop();
        return `${record.name}${ext ? "." + ext : ""}`;
      },
    },
    { title: "Người tạo", dataIndex: "employeeName", key: "employeeName" },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString("vi-VN") : "",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (s: string) => <Tag>{s}</Tag>,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: ReportStorageResponse) => (
        <Space>
          <Button size="small" onClick={() => handleView(record)}>
            Xem
          </Button>
          <Button size="small" onClick={() => handleEdit(record)}>
            Sửa
          </Button>
          <Button
            size="small"
            danger
            onClick={() => handleDelete(record.id, categoryId)}
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

      {/* Thanh tìm kiếm + status */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col flex="auto">
          <Input
            placeholder="Tìm kiếm báo cáo..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              updateReports(e.target.value, statusFilter);
            }}
            allowClear
          />
        </Col>

        <Col>
          <Select
            value={statusFilter}
            style={{ width: 180 }}
            onChange={(value) => {
              setStatusFilter(value);
              updateReports(searchText, value);
            }}
          >
            <Option value="">Tất cả trạng thái</Option>
            <Option value="PENDING">PENDING</Option>
            <Option value="SUCCESS">SUCCESS</Option>
            <Option value="IN_PROGRESS">IN_PROGRESS</Option>
          </Select>
        </Col>

        <Col>
          <Button type="primary" onClick={handleAddNew}>
            + Thêm mới
          </Button>
        </Col>
      </Row>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {groups.map((grp) => (
          <Collapse
            key={grp.id}
            accordion={false}
            defaultActiveKey={[grp.id]} // mở tất cả
            style={{
              borderRadius: 8,
              backgroundColor: "#e0f7fa",
              border: "1px solid #d9d9d9",
            }}
          >
            <Panel header={`${grp.name} - ${grp.code}`} key={grp.id}>
              <div className="overflow-auto">
                <Table
                  dataSource={grp.reports?.content || []}
                  columns={columns(grp.id)}
                  rowKey="id"
                  pagination={{
                    current: grp.reports?.page! + 1 || 1,
                    pageSize: grp.reports?.limit || 10,
                    total: grp.reports?.totalElements || 0,
                    onChange: (page, pageSize) =>
                      fetchReports(
                        grp.id,
                        searchText,
                        page - 1,
                        pageSize,
                        statusFilter
                      ),
                  }}
                />
              </div>
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

          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={2} />
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

          <Form.Item
            label="Upload file"
            rules={[
              { required: !editingReport, message: "Chọn file cho báo cáo" },
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
        </Form>
      </Modal>
    </div>
  );
};

export default ReportStorageDepartment;
