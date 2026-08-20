import { Row, Col, Alert, Progress, Typography } from "antd";
import { useSqlMetadata } from "../hooks/useSqlMetadata";
import ConnectionForm from "../components/ConnectionForm";
import MetadataViewer from "../components/MetadataViewer";

const { Text } = Typography;

export default function SqlMetadataPage() {
  const {
    metadata,
    loading,
    progress,
    stage,
    error,
    analyzeSchema,
  } = useSqlMetadata();

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" closable />}

      <Row gutter={16}>
        <Col xs={24} lg={8}>
          <ConnectionForm loading={loading} onAnalyze={analyzeSchema} />

          {loading && (
            <div className="mt-4">
              <Progress percent={progress} status="active" />
              {stage && <Text type="secondary">{stage}</Text>}
            </div>
          )}
        </Col>

        <Col xs={24} lg={16}>
          {metadata ? (
            <MetadataViewer metadata={metadata} />
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              {loading
                ? "Đang phân tích schema..."
                : "Nhập connection string và bấm phân tích để bắt đầu"}
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}
