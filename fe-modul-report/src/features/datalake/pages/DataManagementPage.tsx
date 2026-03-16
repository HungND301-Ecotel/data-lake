import { Row, Col, Button, Space } from "antd";
import {
  DatabaseOutlined,
  ReloadOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useDataStatus } from "../hooks/useDataStatus";
import DataStatusPanel from "../components/DataStatusPanel";
import FileUploader from "../components/FileUploader";
import SourcesList from "../components/SourcesList";
import LiveImportForm from "../components/LiveImportForm";

const DataManagementPage: React.FC = () => {
  const {
    status,
    sources,
    loading,
    refresh,
    reindex,
    loadData,
    importLive,
  } = useDataStatus();

  return (
    <div className="space-y-4">
      <DataStatusPanel status={status} loading={loading} onReindex={reindex} />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <FileUploader onUploadComplete={refresh} />
        </Col>
        <Col xs={24} lg={12}>
          <LiveImportForm onImport={importLive} loading={loading} />
        </Col>
      </Row>

      <Space wrap>
        <Button
          icon={<DatabaseOutlined />}
          onClick={loadData}
          loading={loading}
        >
          Tải tất cả file Excel
        </Button>
        <Button
          icon={<SyncOutlined />}
          onClick={reindex}
          loading={loading}
        >
          Rebuild Index
        </Button>
        <Button icon={<ReloadOutlined />} onClick={refresh}>
          Làm mới
        </Button>
      </Space>

      <SourcesList sources={sources} loading={loading} onRefresh={refresh} />
    </div>
  );
};

export default DataManagementPage;
