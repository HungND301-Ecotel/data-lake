import { useState } from "react";
import { Upload, message, Card, Button } from "antd";
import { InboxOutlined, FileExcelOutlined, DatabaseOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { dataApi } from "../api/datalakeApi";

const { Dragger } = Upload;

interface FileUploaderProps {
  onUploadComplete?: () => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onUploadComplete }) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const customRequest: UploadProps["customRequest"] = async (options) => {
    const { file, onSuccess, onError, onProgress } = options;
    const uploadFile = file as File;

    try {
      const isBak = uploadFile.name.toLowerCase().endsWith(".bak");

      if (isBak) {
        await dataApi.uploadBak(uploadFile, undefined, true, (event) => {
          if (event.total) {
            onProgress?.({ percent: (event.loaded / event.total) * 100 });
          }
        });
      } else {
        await dataApi.uploadExcel(uploadFile, (event) => {
          if (event.total) {
            onProgress?.({ percent: (event.loaded / event.total) * 100 });
          }
        });
      }

      onSuccess?.(null);
      message.success(`Tải lên ${uploadFile.name} thành công`);
      onUploadComplete?.();
    } catch (err) {
      onError?.(err as Error);
      message.error(`Tải lên ${uploadFile.name} thất bại`);
    }
  };

  const uploadProps: UploadProps = {
    name: "file",
    multiple: true,
    fileList,
    customRequest,
    accept: ".xlsx,.xls,.bak",
    onChange(info) {
      setFileList(info.fileList);
    },
    onRemove() {
      return true;
    },
    iconRender: (file) => {
      const isBak = file.name?.toLowerCase().endsWith(".bak");
      return isBak ? <DatabaseOutlined /> : <FileExcelOutlined />;
    },
  };

  return (
    <Card title="Tải lên tệp" extra={
      fileList.length > 0 && (
        <Button size="small" onClick={() => setFileList([])}>
          Xóa danh sách
        </Button>
      )
    }>
      <Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          Kéo thả file hoặc nhấn để chọn
        </p>
        <p className="ant-upload-hint">
          Hỗ trợ: Excel (.xlsx, .xls) và SQL Backup (.bak)
        </p>
      </Dragger>
    </Card>
  );
};

export default FileUploader;
