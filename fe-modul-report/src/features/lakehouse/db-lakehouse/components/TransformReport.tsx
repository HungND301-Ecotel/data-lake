import { Card, Descriptions, Tag, List, Typography, Collapse } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import type { SilverTransformResponse, GoldTransformResponse, CleaningTableReport, StandardizationTableReport } from "../types/dbLakehouse";

const { Text } = Typography;

interface TransformReportProps {
  silverResult?: SilverTransformResponse | null;
  goldResult?: GoldTransformResponse | null;
}

export default function TransformReport({ silverResult, goldResult }: TransformReportProps) {
  if (!silverResult && !goldResult) return null;

  return (
    <div className="space-y-4">
      {silverResult && (
        <Card title={<><CheckCircleOutlined className="text-green-500 mr-2" />Silver Transform Report</>} size="small">
          <Descriptions size="small" bordered column={2} className="mb-3">
            <Descriptions.Item label="Bronze (nguồn)">{silverResult.bronze_database}</Descriptions.Item>
            <Descriptions.Item label="Silver (đích)">{silverResult.silver_database}</Descriptions.Item>
            <Descriptions.Item label="Bảng đã xử lý" span={2}>
              {silverResult.tables_transformed.map((t) => <Tag key={t}>{t}</Tag>)}
            </Descriptions.Item>
          </Descriptions>
          <Collapse items={Object.entries(silverResult.cleaning_report).map(([table, report]: [string, CleaningTableReport]) => ({
            key: table,
            label: <Text strong>{table}</Text>,
            children: (
              <>
                <Descriptions size="small" column={2}>
                  <Descriptions.Item label="Dòng gốc">{report.original_rows.toLocaleString()}</Descriptions.Item>
                  <Descriptions.Item label="Sau clean">{report.cleaned_rows.toLocaleString()}</Descriptions.Item>
                  <Descriptions.Item label="Trùng lặp đã xóa">{report.duplicates_removed}</Descriptions.Item>
                  <Descriptions.Item label="NULL đã điền">{report.nulls_filled}</Descriptions.Item>
                </Descriptions>
                {report.issues_found.length > 0 && (
                  <List size="small" header={<Text type="warning">Vấn đề phát hiện</Text>}
                    dataSource={report.issues_found} renderItem={(item) => <List.Item>{item}</List.Item>} />
                )}
                {report.actions_applied.length > 0 && (
                  <List size="small" header={<Text type="success">Hành động đã thực hiện</Text>}
                    dataSource={report.actions_applied} renderItem={(item) => <List.Item>{item}</List.Item>} />
                )}
              </>
            ),
          }))} />
          <Text type="success" className="block mt-3">{silverResult.message}</Text>
        </Card>
      )}

      {goldResult && (
        <Card title={<><CheckCircleOutlined className="text-yellow-500 mr-2" />Gold Transform Report</>} size="small">
          <Descriptions size="small" bordered column={2} className="mb-3">
            <Descriptions.Item label="Silver (nguồn)">{goldResult.silver_database}</Descriptions.Item>
            <Descriptions.Item label="Gold (đích)">{goldResult.gold_database}</Descriptions.Item>
            <Descriptions.Item label="Bảng đã xử lý" span={2}>
              {goldResult.tables_transformed.map((t) => <Tag key={t} color="gold">{t}</Tag>)}
            </Descriptions.Item>
          </Descriptions>
          <Collapse items={Object.entries(goldResult.standardization_report).map(([table, report]: [string, StandardizationTableReport]) => ({
            key: table,
            label: <Text strong>{report.source_table} → {report.target_table}</Text>,
            children: (
              <>
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Số dòng">{report.rows.toLocaleString()}</Descriptions.Item>
                </Descriptions>
                {report.columns_renamed.length > 0 && (
                  <List size="small" header={<Text>Cột đã đổi tên</Text>}
                    dataSource={report.columns_renamed} renderItem={(item) => <List.Item><Tag>{item}</Tag></List.Item>} />
                )}
                {report.data_transforms.length > 0 && (
                  <List size="small" header={<Text type="success">Transform đã áp dụng</Text>}
                    dataSource={report.data_transforms} renderItem={(item) => <List.Item>{item}</List.Item>} />
                )}
              </>
            ),
          }))} />
          <Text type="success" className="block mt-3">{goldResult.message}</Text>
        </Card>
      )}
    </div>
  );
}
