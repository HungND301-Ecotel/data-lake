import { Upload, Card, message, Progress } from "antd";
import { InboxOutlined } from "@ant-design/icons";

const { Dragger } = Upload;

interface Props {
  uploading: boolean;
  uploadProgress: number;
  onUpload: (file: File) => Promise<{ success: boolean; error?: string }>;
}

export default function FileUploadZone({ uploading, uploadProgress, onUpload }: Props) {
  return (
    <Card title="Upload file vào Pipeline" size="small">
      <Dragger
        multiple={false}
        showUploadList={false}
        disabled={uploading}
        customRequest={async ({ file, onSuccess, onError }) => {
          const result = await onUpload(file as File);
          if (result.success) {
            message.success("Upload thành công! File đang được xử lý.");
            onSuccess?.({});
          } else {
            message.error(result.error || "Upload thất bại");
            onError?.(new Error(result.error));
          }
        }}
        accept=".png,.jpg,.jpeg,.pdf,.docx,.xlsx,.xls,.csv"
      >
        <p className="text-4xl text-gray-400">
          <InboxOutlined />
        </p>
        <p className="text-base">Kéo thả file hoặc click để chọn</p>
        <p className="text-sm text-gray-400">
          Hỗ trợ: Ảnh (PNG, JPG), PDF, DOCX, Excel, CSV
        </p>
      </Dragger>
      {uploading && (
        <Progress percent={uploadProgress} status="active" className="mt-3" />
      )}
    </Card>
  );
}
