import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  message,
  Space,
  Select,
} from "antd";
import { DeleteOutlined, ExclamationCircleFilled, PlusOutlined } from "@ant-design/icons";
import reportApi from "../services/reportApi";
import type { Report } from "../types/report";
import { useNavigate } from "react-router-dom";
export const ReportList: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [modal, contextHolder] = Modal.useModal();
  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await reportApi.getReportAll();
      setReports(data.filter((r) => r.name)); // loại bỏ null
    } catch {
      message.error("Không tải được danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);


const showDeleteConfirm = async (id: string | null) => {
  modal.confirm({
    title: "Bạn có chắc muốn xoá báo cáo này?",
    icon: <ExclamationCircleFilled />,
    content: "Thao tác này không thể hoàn tác.",
    okText: "Xoá",
    okType: "danger",
    cancelText: "Hủy",
    async onOk() {
      try {
        if(id != null){
          await reportApi.deleteReportById(id);
        }
        setReports(prev => prev.filter(r => r.id !== id));
        message.success("Đã xoá báo cáo");
      } catch (err) {
        console.error("Lỗi xoá báo cáo:", err);
        message.error("Xoá báo cáo thất bại, vui lòng thử lại");
      }
    },
  });
};


  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      const newReport: Report = {
        id: null,
        name: values.name,
        pageType: values.pageType,
        marginTop: Number(values.marginTop ?? 0),
        marginBottom: Number(values.marginBottom ?? 0),
        marginLeft: Number(values.marginLeft ?? 0),
        marginRight: Number(values.marginRight ?? 0),
        items: [],
      };

      console.log("🚀 Thêm mới report:", newReport);

      const newId = await reportApi.addReport(newReport);
      newReport.id = newId;
      setReports([...reports, newReport]);
      setIsModalVisible(false);
      form.resetFields();
      message.success("Đã thêm báo cáo mới");
    } catch (error) {
      console.error(error);
      message.error("Thêm báo cáo thất bại");
    }
  };

  const filteredData = reports.filter((r) =>
    (r.name ?? "").toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Tên báo cáo",
      dataIndex: "name",
      key: "name",
      render: (text: string | null) => <span>{text}</span>,
    },
    
    {
      title: "Hành động",
      key: "actions",
      width: 150,
      render: (_: any, record: Report) => (
        <Space>
          <Button
            type="default"
            onClick={() => navigate(`/report/template/us/${record.id}`)}
          >
            Xem
          </Button>
          <Button
            type="default"
            onClick={() => navigate(`/report/template/edit/${record.id}`)}
          >
            Sửa
          </Button>
          <Button
            danger
            type="primary"
            icon={<DeleteOutlined />}
            onClick={() => showDeleteConfirm(record.id)}
          >
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-8 bg-white min-h-screen text-black">
      {contextHolder}
  
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
  
        {/* Search + button */}
        <div className="flex items-center gap-3 w-1/2">
          <Input
            placeholder="Tìm kiếm báo cáo..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1 border-gray-400"
            size="large"
          />
          <Button
            type="primary"
            size="large"
            className="px-6"
          >
            Tìm kiếm
          </Button>
        </div>
  
        {/* Add button */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          className="bg-black hover:bg-gray-700 text-white px-4 py-2"
          onClick={() => setIsModalVisible(true)}
        >
          Thêm mới
        </Button>
      </div>
  
      {/* Table */}
      <div className="border border-gray-300 rounded-lg shadow-sm">
        <Table
          loading={loading}
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={false}
          showHeader={false}
        />
      </div>
  
      {/* Modal */}
      <Modal
        title="Thêm báo cáo mới"
        open={isModalVisible}
        onOk={handleAdd}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        okText="Thêm"
        cancelText="Huỷ"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên báo cáo"
            name="name"
            rules={[{ required: true, message: "Nhập tên báo cáo" }]}
          >
            <Input />
          </Form.Item>
  
          <Form.Item
            label="Loại trang"
            name="pageType"
            rules={[{ required: true, message: "Chọn loại trang" }]}
          >
            <Select placeholder="Chọn loại trang">
              <Select.Option value="portrait">Dọc (Portrait)</Select.Option>
              <Select.Option value="landscape">Ngang (Landscape)</Select.Option>
            </Select>
          </Form.Item>
  
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Margin Top" name="marginTop">
              <Input type="number" />
            </Form.Item>
            <Form.Item label="Margin Bottom" name="marginBottom">
              <Input type="number" />
            </Form.Item>
            <Form.Item label="Margin Left" name="marginLeft">
              <Input type="number" />
            </Form.Item>
            <Form.Item label="Margin Right" name="marginRight">
              <Input type="number" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
  
};
