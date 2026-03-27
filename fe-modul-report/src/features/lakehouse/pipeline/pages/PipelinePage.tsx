import { useState } from "react";
import { Card, Button, Alert, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { usePipeline } from "../hooks/usePipeline";
import FileUploadZone from "../components/FileUploadZone";
import LayerTabs from "../components/LayerTabs";
import FileListTable from "../components/FileListTable";
import FilePreviewPanel from "../components/FilePreviewPanel";
import type { BronzeRecord, SilverRecord } from "../../shared/types/lakehouse";

export default function PipelinePage() {
  const {
    rawFiles, bronzeRecords, silverRecords,
    activeLayer, setActiveLayer,
    loading, uploading, uploadProgress, error,
    upload, refresh, isAsyncResponse,
    getPreviewUrl, getDownloadUrl, getSilverDownloadUrl,
  } = usePipeline();

  const [selectedBronze, setSelectedBronze] = useState<BronzeRecord | null>(null);
  const [selectedSilver, setSelectedSilver] = useState<SilverRecord | null>(null);

  const handleUpload = async (file: File) => {
    const result = await upload(file, false);
    if (result.success && result.data && !isAsyncResponse(result.data)) {
      const data = result.data as { bronze: BronzeRecord; silver: SilverRecord };
      setSelectedBronze(data.bronze);
      setSelectedSilver(data.silver);
      message.success("File đã xử lý xong qua pipeline Raw → Bronze → Silver");
    }
    return result;
  };

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" closable />}

      <FileUploadZone
        uploading={uploading}
        uploadProgress={uploadProgress}
        onUpload={handleUpload}
      />

      <Card
        extra={
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
            Làm mới
          </Button>
        }
      >
        <LayerTabs
          activeLayer={activeLayer}
          onChange={setActiveLayer}
          rawCount={rawFiles.length}
          bronzeCount={bronzeRecords.length}
          silverCount={silverRecords.length}
        />
        <FileListTable
          layer={activeLayer}
          rawFiles={rawFiles}
          bronzeRecords={bronzeRecords}
          silverRecords={silverRecords}
          loading={loading}
          getPreviewUrl={getPreviewUrl}
          getDownloadUrl={getDownloadUrl}
          getSilverDownloadUrl={getSilverDownloadUrl}
        />
      </Card>

      <FilePreviewPanel bronzeData={selectedBronze} silverData={selectedSilver} />
    </div>
  );
}
