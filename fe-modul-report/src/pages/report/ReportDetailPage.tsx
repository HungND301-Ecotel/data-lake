import { useEffect, useState, type JSX } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Descriptions,
  Timeline,
  Button,
  Spin,
  Row,
  Col,
  Avatar,
  Tag,
  List,
  Space,
  Typography,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

type Attachment = {
  id: number;
  name: string;
  size: string;
  uploadedAt: string;
  s3Key: string;
};

type Approval = {
  id: number;
  status: string;
  description: string;
  approver: string;
  approverAvatar?: string;
  approverPosition?: string;
  createdAt: string;
  comment?: string;
};

type Report = {
  key: string;
  name: string;
  type: string;
  department: string;
  category: string;
  creator: string;
  creatorAvatar?: string;
  creatorPosition?: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  status: string;
  fileSize: string;
  version: string;
  reportFile: string;
  attachments: Attachment[];
  approvalTimeline: Approval[];
};

// Fake data
const fakeReports: Report[] = [
  {
    key: "1",
    name: "Báo cáo bán hàng tháng 11",
    type: "Word",
    department: "Kinh doanh",
    category: "Doanh số",
    creator: "Nguyễn A",
    creatorAvatar: "https://i.pravatar.cc/150?img=1",
    creatorPosition: "Nhân viên kinh doanh",
    createdAt: "2025-11-30",
    updatedAt: "2025-12-01",
    description: "Tổng hợp doanh số tháng 11",
    status: "Chờ duyệt",
    fileSize: "2 MB",
    version: "v1.0",
    reportFile: "s3_001",
    attachments: [
      { id: 1, name: "Bán hàng tháng 11.docx", size: "2 MB", uploadedAt: "2025-11-30", s3Key: "s3_001" },
    ],
    approvalTimeline: [
      { id: 1, status: "Tạo", description: "Nhân viên tạo báo cáo", approver: "Nguyễn A", approverAvatar: "https://i.pravatar.cc/150?img=1", approverPosition: "Nhân viên kinh doanh", createdAt: "2025-11-30", comment: "Khởi tạo báo cáo" },
      { id: 2, status: "Chờ duyệt", description: "Trưởng phòng duyệt", approver: "Trần B", approverAvatar: "https://i.pravatar.cc/150?img=2", approverPosition: "Trưởng phòng", createdAt: "2025-12-01" },
    ],
  },
  {
    key: "2",
    name: "Báo cáo tồn kho cuối tháng",
    type: "Excel",
    department: "Kho",
    category: "Tồn kho",
    creator: "Trần B",
    creatorAvatar: "https://i.pravatar.cc/150?img=2",
    creatorPosition: "Nhân viên kho",
    createdAt: "2025-11-29",
    updatedAt: "2025-12-01",
    description: "Báo cáo tồn kho tháng 11",
    status: "Đã duyệt",
    fileSize: "3 MB",
    version: "v1.2",
    reportFile: "s3_002",
    attachments: [
      { id: 1, name: "Tồn kho tháng 11.xlsx", size: "3 MB", uploadedAt: "2025-11-29", s3Key: "s3_002" },
      { id: 2, name: "Chi tiết kho.csv", size: "1 MB", uploadedAt: "2025-11-29", s3Key: "s3_003" },
    ],
    approvalTimeline: [
      { id: 1, status: "Tạo", description: "Nhân viên tạo báo cáo", approver: "Trần B", approverAvatar: "https://i.pravatar.cc/150?img=2", approverPosition: "Nhân viên kho", createdAt: "2025-11-29" },
      { id: 2, status: "Duyệt", description: "Quản lý duyệt", approver: "Lê C", approverAvatar: "https://i.pravatar.cc/150?img=3", approverPosition: "Quản lý kho", createdAt: "2025-11-30", comment: "Ok, duyệt" },
      { id: 3, status: "Đã duyệt", description: "Kế toán trưởng ký", approver: "Nguyễn D", approverAvatar: "https://i.pravatar.cc/150?img=4", approverPosition: "Kế toán trưởng", createdAt: "2025-12-01" },
    ],
  },
  {
    key: "3",
    name: "Báo cáo Marketing tháng 11",
    type: "PDF",
    department: "Marketing",
    category: "Chiến dịch",
    creator: "Lê C",
    creatorAvatar: "https://i.pravatar.cc/150?img=3",
    creatorPosition: "Nhân viên Marketing",
    createdAt: "2025-11-28",
    updatedAt: "2025-12-01",
    description: "Hiệu quả chiến dịch quảng cáo",
    status: "Từ chối",
    fileSize: "1.5 MB",
    version: "v1.0",
    reportFile: "s3_003",
    attachments: [
      { id: 1, name: "Marketing Nov.pdf", size: "1.5 MB", uploadedAt: "2025-11-28", s3Key: "s3_004" },
    ],
    approvalTimeline: [
      { id: 1, status: "Tạo", description: "Nhân viên tạo báo cáo", approver: "Lê C", approverAvatar: "https://i.pravatar.cc/150?img=3", approverPosition: "Nhân viên Marketing", createdAt: "2025-11-28" },
      { id: 2, status: "Từ chối", description: "Trưởng phòng từ chối", approver: "Nguyễn E", approverAvatar: "https://i.pravatar.cc/150?img=5", approverPosition: "Trưởng phòng Marketing", createdAt: "2025-12-01", comment: "Cần bổ sung dữ liệu" },
    ],
  },
];

const statusColorMap: Record<string, string> = {
  Nháp: "default",
  "Chờ duyệt": "orange",
  "Đã duyệt": "green",
  "Từ chối": "red",
};

const statusIconMap: Record<string, JSX.Element> = {
  Nháp: <ClockCircleOutlined />,
  "Chờ duyệt": <LoadingOutlined spin />,
  "Đã duyệt": <CheckCircleOutlined />,
  "Từ chối": <CloseCircleOutlined />,
};

const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const r = fakeReports.find((r) => r.key === id) || null;
    setReport(r);
    setLoading(false);
  }, [id]);

  if (loading) return <Spin tip="Đang tải..." style={{ marginTop: 100 }} />;
  if (!report) return <div>Không tìm thấy báo cáo</div>;

  return (
    <div className="p-4">
      <Row gutter={24}>
        <Col xs={24} md={16}>
          {/* Report Info */}
          <Card title={report.name} style={{ marginBottom: 24 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Mô tả" span={2}>
                {report.description}
              </Descriptions.Item>
              <Descriptions.Item label="Loại file">{report.type}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusColorMap[report.status]}>
                  {statusIconMap[report.status]} {report.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Người tạo">
                <Space>
                  <Avatar src={report.creatorAvatar} />
                  <div>
                    <div>{report.creator}</div>
                    <Text type="secondary">{report.creatorPosition}</Text>
                  </div>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{report.createdAt}</Descriptions.Item>
              <Descriptions.Item label="Ngày cập nhật">{report.updatedAt}</Descriptions.Item>
              <Descriptions.Item label="Phòng ban">{report.department}</Descriptions.Item>
              <Descriptions.Item label="Đầu mục báo cáo">{report.category}</Descriptions.Item>
              <Descriptions.Item label="Kích thước">{report.fileSize}</Descriptions.Item>
              <Descriptions.Item label="Version">{report.version}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Right Sidebar: Timeline */}
        <Col xs={24} md={8}>
          <Card title="Timeline duyệt">
            <Timeline>
              {report.approvalTimeline.map((item: Approval) => (
                <Timeline.Item
                  key={item.id}
                  dot={statusIconMap[item.status]}
                  color={statusColorMap[item.status]}
                >
                  <b>{item.status}</b> - {item.description} (
                  <i>{item.approver}</i>) - {item.createdAt}
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* Attachments */}
      <Card title="Tài liệu đính kèm" style={{ marginTop: 24 }}>
        <List
          dataSource={report.attachments}
          renderItem={(file: Attachment) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  icon={<DownloadOutlined />}
                  onClick={() => alert(`Tải file: ${file.name}`)}
                >
                  Tải xuống
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={file.name}
                description={`Kích thước: ${file.size} | Upload: ${file.uploadedAt}`}
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default ReportDetailPage;
