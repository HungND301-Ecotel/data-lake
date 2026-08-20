import { Card, Typography, Empty, Descriptions, Tag } from "antd";
import type { BronzeRecord, SilverRecord } from "../../shared/types/lakehouse";

const { Paragraph, Text } = Typography;

interface Props {
  bronzeData?: BronzeRecord | null;
  silverData?: SilverRecord | null;
}

export default function FilePreviewPanel({ bronzeData, silverData }: Props) {
  if (!bronzeData && !silverData) {
    return null;
  }

  return (
    <div className="space-y-4">
      {bronzeData && (
        <Card title="Bronze — Text đã trích xuất (OCR)" size="small">
          <Paragraph
            className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded max-h-60 overflow-auto"
          >
            {bronzeData.extracted_text || <Empty description="Không có text" />}
          </Paragraph>
        </Card>
      )}

      {silverData && silverData.preview_data.length > 0 && (
        <Card title="Silver — Dữ liệu cấu trúc" size="small">
          <Descriptions column={2} size="small" bordered>
            {silverData.preview_data.map((item, i) => (
              <Descriptions.Item key={i} label={<Text strong>{item.field}</Text>}>
                <Tag>{item.value}</Tag>
              </Descriptions.Item>
            ))}
          </Descriptions>
        </Card>
      )}
    </div>
  );
}
