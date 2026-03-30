import { Upload, Progress, Switch, Space, Typography } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { useState } from "react";

const { Dragger } = Upload;
const { Text } = Typography;

interface BakUploadZoneProps {
  uploading: boolean;
  uploadProgress: number;
  onUpload: (file: File, fullPipeline: boolean) => void;
}

export default function BakUploadZone({ uploading, uploadProgress, onUpload }: BakUploadZoneProps) {
  const [fullPipeline, setFullPipeline] = useState(true);

  return (
    <div className="space-y-3">
      <Space>
        <Switch
          checked={fullPipeline}
          onChange={setFullPipeline}
          checkedChildren="Full Pipeline"
          unCheckedChildren="Bronze Only"
        />
        <Text type="secondary">
          {fullPipeline
            ? "Upload .bak → Bronze → Silver → Gold (tự động)"
            : "Upload .bak → Bronze only (xử lý thủ công từng bước)"}
        </Text>
      </Space>

      <Dragger
        accept=".bak"
        multiple={false}
        showUploadList={false}
        disabled={uploading}
        beforeUpload={(file) => {
          onUpload(file, fullPipeline);
          return false;
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Click hoặc kéo thả file <strong>.bak</strong> vào đây
        </p>
        <p className="ant-upload-hint">
          Hỗ trợ file backup SQL Server (.bak). Hệ thống sẽ restore và xử lý dữ liệu tự động.
        </p>
      </Dragger>

      {uploading && (
        <Progress percent={uploadProgress} status="active" strokeColor={{ from: "#108ee9", to: "#87d068" }} />
      )}
    </div>
  );
}
