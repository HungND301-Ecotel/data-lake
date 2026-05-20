import { useState } from "react";
import { Button, Select, Card, message, Statistic } from "antd";
import { CloudUploadOutlined } from "@ant-design/icons";
import type { RawFile } from "../../shared/types/lakehouse";

interface Props {
  rawFiles: RawFile[];
  loading: boolean;
  onIngest: (fileIds: string[]) => Promise<{ success: boolean; error?: string; data?: { documents_processed: number } }>;
}

export default function IngestButton({ rawFiles, loading, onIngest }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastCount, setLastCount] = useState<number | null>(null);

  const handleIngest = async () => {
    if (selectedIds.length === 0) {
      message.warning("Chọn ít nhất 1 file để ingest");
      return;
    }
    const result = await onIngest(selectedIds);
    if (result.success) {
      message.success(`Ingest thành công ${result.data?.documents_processed || 0} documents`);
      setLastCount(result.data?.documents_processed || 0);
      setSelectedIds([]);
    } else {
      message.error(result.error);
    }
  };

  return (
    <Card title="Ingest vào FAISS" size="small">
      <Select
        mode="multiple"
        value={selectedIds}
        onChange={setSelectedIds}
        placeholder="Chọn files để ingest"
        className="w-full mb-3"
        options={rawFiles.map((f) => ({ value: f.file_id, label: f.filename }))}
      />
      <Button
        type="primary"
        icon={<CloudUploadOutlined />}
        loading={loading}
        onClick={handleIngest}
        block
      >
        Ingest {selectedIds.length > 0 ? `(${selectedIds.length} files)` : ""}
      </Button>
      {lastCount !== null && (
        <Statistic title="Documents đã ingest" value={lastCount} className="mt-3" />
      )}
    </Card>
  );
}
