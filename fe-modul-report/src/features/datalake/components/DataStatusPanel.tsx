import { Card, Row, Col, Statistic, Tag, Button, Spin } from "antd";
import {
  DatabaseOutlined,
  FileExcelOutlined,
  CloudServerOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { DataStatus } from "../types/datalake";

interface DataStatusPanelProps {
  status: DataStatus | null;
  loading: boolean;
  onReindex: () => void;
}

const DataStatusPanel: React.FC<DataStatusPanelProps> = ({
  status,
  loading,
  onReindex,
}) => {
  if (loading && !status) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <Spin />
        </div>
      </Card>
    );
  }

  return (
    <Card
      title="Trạng thái dữ liệu"
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={onReindex}
          loading={loading}
        >
          Reindex
        </Button>
      }
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Statistic
            title="Vector Store"
            valueRender={() => (
              <Tag
                icon={
                  status?.vector_store_loaded ? (
                    <CheckCircleOutlined />
                  ) : (
                    <CloseCircleOutlined />
                  )
                }
                color={status?.vector_store_loaded ? "success" : "error"}
              >
                {status?.vector_store_loaded ? "Đã tải" : "Chưa tải"}
              </Tag>
            )}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="Tổng tài liệu"
            value={status?.document_count || 0}
            prefix={<DatabaseOutlined />}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="File Excel"
            value={status?.excel_files_count || 0}
            prefix={<FileExcelOutlined />}
          />
        </Col>
        <Col xs={12} sm={6}>
          <Statistic
            title="File SQL Backup"
            value={status?.bak_files_count || 0}
            prefix={<CloudServerOutlined />}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default DataStatusPanel;
