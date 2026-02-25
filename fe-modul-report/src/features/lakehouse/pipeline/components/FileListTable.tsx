import { Table, Button, Typography, Tag, Space, Tooltip } from "antd";
import { EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import type { RawFile, BronzeRecord, SilverRecord } from "../../shared/types/lakehouse";
import type { LayerType } from "../hooks/usePipeline";

const { Text, Paragraph } = Typography;

interface Props {
  layer: LayerType;
  rawFiles: RawFile[];
  bronzeRecords: BronzeRecord[];
  silverRecords: SilverRecord[];
  loading: boolean;
  onPreview?: (fileId: string) => void;
  getPreviewUrl: (fileId: string) => string;
  getDownloadUrl: (fileId: string) => string;
  getSilverDownloadUrl: (fileId: string) => string;
}

export default function FileListTable({
  layer, rawFiles, bronzeRecords, silverRecords, loading,
  getPreviewUrl, getDownloadUrl, getSilverDownloadUrl,
}: Props) {
  if (layer === "raw") {
    const columns = [
      { title: "File ID", dataIndex: "file_id", key: "file_id", width: 120, render: (id: string) => <Text className="font-mono text-xs">{id.substring(0, 12)}...</Text> },
      { title: "Tên file", dataIndex: "filename", key: "filename", render: (name: string) => <Text className="font-medium">{name}</Text> },
      { title: "Thời gian upload", dataIndex: "upload_timestamp", key: "upload_timestamp", width: 180, render: (d: string) => new Date(d).toLocaleString("vi-VN") },
      {
        title: "Hành động", key: "actions", width: 150,
        render: (_: unknown, record: RawFile) => (
          <Space>
            <Button size="small" icon={<EyeOutlined />} href={getPreviewUrl(record.file_id)} target="_blank">Xem</Button>
            <Button size="small" icon={<DownloadOutlined />} href={getDownloadUrl(record.file_id)}>Tải</Button>
          </Space>
        ),
      },
    ];
    return <Table columns={columns} dataSource={rawFiles} rowKey="file_id" loading={loading} size="small" pagination={{ pageSize: 10 }} />;
  }

  if (layer === "bronze") {
    const columns = [
      { title: "File ID", dataIndex: "file_id", key: "file_id", width: 120, render: (id: string) => <Text className="font-mono text-xs">{id.substring(0, 12)}...</Text> },
      {
        title: "Text đã trích xuất", dataIndex: "extracted_text", key: "extracted_text",
        render: (text: string) => (
          <Tooltip title={text.substring(0, 500)}>
            <Paragraph ellipsis={{ rows: 2 }} className="mb-0 text-sm">{text}</Paragraph>
          </Tooltip>
        ),
      },
      {
        title: "Độ dài", key: "length", width: 100,
        render: (_: unknown, record: BronzeRecord) => <Tag>{record.extracted_text.length.toLocaleString()} chars</Tag>,
      },
    ];
    return <Table columns={columns} dataSource={bronzeRecords} rowKey="file_id" loading={loading} size="small" pagination={{ pageSize: 10 }} />;
  }

  // Silver
  const columns = [
    { title: "File ID", dataIndex: "file_id", key: "file_id", width: 120, render: (id: string) => <Text className="font-mono text-xs">{id.substring(0, 12)}...</Text> },
    {
      title: "Preview dữ liệu", dataIndex: "preview_data", key: "preview_data",
      render: (data: SilverRecord["preview_data"]) => (
        <div>
          {data.slice(0, 3).map((item, i) => (
            <Tag key={i}><strong>{item.field}:</strong> {item.value}</Tag>
          ))}
          {data.length > 3 && <Tag>+{data.length - 3} fields</Tag>}
        </div>
      ),
    },
    {
      title: "Hành động", key: "actions", width: 100,
      render: (_: unknown, record: SilverRecord) => (
        <Button size="small" icon={<DownloadOutlined />} href={getSilverDownloadUrl(record.file_id)}>JSON</Button>
      ),
    },
  ];
  return <Table columns={columns} dataSource={silverRecords} rowKey="file_id" loading={loading} size="small" pagination={{ pageSize: 10 }} />;
}
