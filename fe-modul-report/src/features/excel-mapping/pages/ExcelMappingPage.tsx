import { Card, Upload, Button, Alert, Spin, Empty } from "antd";
import { UploadOutlined, FileExcelOutlined } from "@ant-design/icons";
import { useExcelMapping } from "../hooks/useExcelMapping";
import MappingResultTable from "../components/MappingResultTable";

export default function ExcelMappingPage() {
  const { result, loading, error, analyze, clear } = useExcelMapping();

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" closable />}

      <Card
        title={
          <span>
            <FileExcelOutlined className="mr-2" />
            Excel Column Mapping
          </span>
        }
        size="small"
        extra={
          result && (
            <Button size="small" onClick={clear}>
              Phân tích file khác
            </Button>
          )
        }
      >
        {!result && (
          <Upload.Dragger
            accept=".xlsx,.xls,.csv"
            maxCount={1}
            showUploadList={false}
            beforeUpload={(file) => {
              analyze(file);
              return false;
            }}
            disabled={loading}
          >
            {loading ? (
              <div className="py-8">
                <Spin size="large" />
                <p className="mt-4 text-gray-500">Đang phân tích cấu trúc file...</p>
              </div>
            ) : (
              <div className="py-8">
                <UploadOutlined className="text-4xl text-blue-400" />
                <p className="mt-4 text-gray-600">
                  Kéo thả file Excel/CSV hoặc click để chọn
                </p>
                <p className="text-gray-400 text-sm">
                  Hỗ trợ .xlsx, .xls, .csv - AI sẽ tự động phân tích header và mapping cột
                </p>
              </div>
            )}
          </Upload.Dragger>
        )}
      </Card>

      {result ? (
        <MappingResultTable result={result} />
      ) : (
        !loading && (
          <Empty description="Upload file Excel để AI phân tích column mapping" />
        )
      )}
    </div>
  );
}
