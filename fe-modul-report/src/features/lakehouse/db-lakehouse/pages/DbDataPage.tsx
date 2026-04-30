import { useState } from "react";
import { Card, Button, Alert, Modal, Typography } from "antd";
import { ReloadOutlined, DatabaseOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { useDbPipeline, type DbLayerType } from "../hooks/useDbPipeline";
import { useServer } from "../hooks/useServer";
import DatabaseList from "../components/DatabaseList";
import DatabaseDetail from "../components/DatabaseDetail";
import ServerSelector from "../components/ServerSelector";

const { Title } = Typography;

const layerLabels: Record<DbLayerType, string> = {
  bronze: "Bronze - Dữ liệu thô",
  silver: "Silver - Dữ liệu đã clean",
  gold: "Gold - Dữ liệu chuẩn hoá",
};

const layerColors: Record<DbLayerType, string> = {
  bronze: "#fa8c16",
  silver: "#1890ff",
  gold: "#faad14",
};

export default function DbDataPage() {
  const { layer = "bronze" } = useParams<{ layer: string }>();
  const activeLayer = (["bronze", "silver", "gold"].includes(layer) ? layer : "bronze") as DbLayerType;

  const {
    loading, error,
    fetchDatabases, viewDatabase, selectedDb,
    databasesByLayer,
  } = useDbPipeline();

  const { servers, defaultServer, loading: loadingServers } = useServer();
  const [serverId, setServerId] = useState<string>("");
  const activeServerId = serverId || defaultServer?.id || "";
  const [detailVisible, setDetailVisible] = useState(false);

  const handleView = async (dbName: string) => {
    const result = await viewDatabase(dbName);
    if (result.success) {
      setDetailVisible(true);
    }
  };

  const databases = databasesByLayer(activeLayer);

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" closable />}

      <Card
        title={
          <Title level={5} className="mb-0">
            <DatabaseOutlined className="mr-2" style={{ color: layerColors[activeLayer] }} />
            {layerLabels[activeLayer]}
          </Title>
        }
        extra={
          <div className="flex items-center gap-3">
            <ServerSelector
              servers={servers}
              value={activeServerId}
              onChange={setServerId}
              loading={loadingServers}
            />
            <Button icon={<ReloadOutlined />} onClick={fetchDatabases} loading={loading}>
              Làm mới
            </Button>
          </div>
        }
      >
        <DatabaseList databases={databases} loading={loading} onView={handleView} />
      </Card>

      <Modal
        title={selectedDb ? `Chi tiết: ${selectedDb.database_name}` : "Chi tiết Database"}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={800}
      >
        {selectedDb && <DatabaseDetail data={selectedDb} />}
      </Modal>
    </div>
  );
}
