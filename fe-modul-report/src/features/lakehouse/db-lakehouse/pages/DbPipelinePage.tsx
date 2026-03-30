import { useState } from "react";
import { Card, Tabs, Button, Alert, Modal, message } from "antd";
import { ReloadOutlined, DatabaseOutlined } from "@ant-design/icons";
import { useDbPipeline } from "../hooks/useDbPipeline";
import { useDbStream } from "../hooks/useDbStream";
import BakUploadZone from "../components/BakUploadZone";
import DatabaseList from "../components/DatabaseList";
import DatabaseDetail from "../components/DatabaseDetail";
import PipelineProgress from "../components/PipelineProgress";

export default function DbPipelinePage() {
  const {
    activeLayer, setActiveLayer,
    loading, error,
    fetchDatabases, viewDatabase, selectedDb,
    databasesByLayer,
  } = useDbPipeline();

  const stream = useDbStream();
  const [detailVisible, setDetailVisible] = useState(false);

  const handleUpload = async (file: File, fullPipeline: boolean) => {
    if (fullPipeline) {
      await stream.pipelineUploadStream(file);
    } else {
      await stream.bronzeUploadStream(file);
    }
    await fetchDatabases();
    if (stream.phase !== "error") {
      message.success("Xử lý hoàn tất!");
    }
  };

  const handleView = async (dbName: string) => {
    const result = await viewDatabase(dbName);
    if (result.success) {
      setDetailVisible(true);
    }
  };

  const tabItems = [
    {
      key: "bronze",
      label: `Bronze (${databasesByLayer("bronze").length})`,
      children: <DatabaseList databases={databasesByLayer("bronze")} loading={loading} onView={handleView} />,
    },
    {
      key: "silver",
      label: `Silver (${databasesByLayer("silver").length})`,
      children: <DatabaseList databases={databasesByLayer("silver")} loading={loading} onView={handleView} />,
    },
    {
      key: "gold",
      label: `Gold (${databasesByLayer("gold").length})`,
      children: <DatabaseList databases={databasesByLayer("gold")} loading={loading} onView={handleView} />,
    },
  ];

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" closable />}

      <Card title={<><DatabaseOutlined className="mr-2" />DB Lakehouse - Upload & Pipeline</>}>
        <BakUploadZone
          uploading={stream.streaming}
          uploadProgress={stream.progress}
          onUpload={handleUpload}
        />
      </Card>

      <PipelineProgress
        progress={stream.progress}
        phase={stream.phase}
        message={stream.message}
        logs={stream.logs}
        streaming={stream.streaming}
        error={stream.error}
      />

      <Card
        extra={
          <Button icon={<ReloadOutlined />} onClick={fetchDatabases} loading={loading}>
            Làm mới
          </Button>
        }
      >
        <Tabs activeKey={activeLayer} onChange={(k) => setActiveLayer(k as typeof activeLayer)} items={tabItems} />
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
