import { useState } from "react";
import { Card, Upload, Input, Button, Alert, message } from "antd";
import { InboxOutlined, SearchOutlined } from "@ant-design/icons";
import { useTableQa } from "../hooks/useTableQa";
import TableQaResult from "../components/TableQaResult";
import type { UploadFile } from "antd/es/upload/interface";

const { Dragger } = Upload;
const { TextArea } = Input;

export default function TableQaPage() {
  const { result, loading, error, askQuestion, clear } = useTableQa();
  const [file, setFile] = useState<File | null>(null);
  const [query, setQuery] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleSubmit = async () => {
    if (!file) {
      message.warning("Vui lòng upload file trước");
      return;
    }
    if (!query.trim()) {
      message.warning("Vui lòng nhập câu hỏi");
      return;
    }
    const res = await askQuestion(file, query.trim());
    if (res.success) {
      message.success("Phân tích xong!");
    } else {
      message.error(res.error);
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" closable />}

      <Card title="Table QA — Hỏi đáp với Excel/CSV" size="small">
        <div className="space-y-4">
          <Dragger
            maxCount={1}
            fileList={fileList}
            accept=".xlsx,.xls,.csv"
            beforeUpload={(f) => {
              setFile(f);
              setFileList([{ uid: "-1", name: f.name, status: "done" }]);
              clear();
              return false;
            }}
            onRemove={() => {
              setFile(null);
              setFileList([]);
              clear();
            }}
          >
            <p className="text-3xl text-gray-400"><InboxOutlined /></p>
            <p>Kéo thả file Excel/CSV hoặc click để chọn</p>
          </Dragger>

          <div className="flex gap-2">
            <TextArea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập câu hỏi về dữ liệu... VD: Tổng doanh thu theo tháng?"
              autoSize={{ minRows: 2, maxRows: 4 }}
              disabled={!file}
              onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              className="flex-1"
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              loading={loading}
              disabled={!file || !query.trim()}
              onClick={handleSubmit}
              className="h-auto"
            >
              Phân tích
            </Button>
          </div>
        </div>
      </Card>

      <TableQaResult result={result} />
    </div>
  );
}
