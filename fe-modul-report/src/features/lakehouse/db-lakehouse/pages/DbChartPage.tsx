import { useState, useEffect } from "react";
import { Select, Card, Input, Button, Alert, Typography, Radio } from "antd";
import { BarChartOutlined, DatabaseOutlined, SearchOutlined } from "@ant-design/icons";
import { dbLakehouseApi } from "../api/dbLakehouseApi";
import PlotlyChartView from "../components/PlotlyChartView";
import type { DatabaseMeta, ChartResponse } from "../types/dbLakehouse";

const { Title, Text } = Typography;
const { TextArea } = Input;

const CHART_TYPES = [
  { value: "", label: "Tự động (AI chọn)" },
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "pie", label: "Pie" },
  { value: "scatter", label: "Scatter" },
  { value: "heatmap", label: "Heatmap" },
];

export default function DbChartPage() {
  const [goldDatabases, setGoldDatabases] = useState<DatabaseMeta[]>([]);
  const [selectedDb, setSelectedDb] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [chartType, setChartType] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDbs, setLoadingDbs] = useState(false);
  const [result, setResult] = useState<ChartResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDbs = async () => {
      setLoadingDbs(true);
      try {
        const res = await dbLakehouseApi.listDatabases();
        const goldDbs = Object.values(res.databases || {}).filter((db) => db.layer === "gold");
        setGoldDatabases(goldDbs);
        if (goldDbs.length > 0) setSelectedDb(goldDbs[0].database);
      } catch {
        // handled by interceptor
      } finally {
        setLoadingDbs(false);
      }
    };
    fetchDbs();
  }, []);

  const handleGenerate = async () => {
    if (!selectedDb || !question.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await dbLakehouseApi.chart({
        database: selectedDb,
        question: question.trim(),
        chart_type: chartType || undefined,
      });
      setResult(res);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || "Lỗi tạo biểu đồ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" closable />}

      <Card>
        <Title level={5}>
          <BarChartOutlined className="mr-2" />
          DB Lakehouse - Tạo biểu đồ
        </Title>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <DatabaseOutlined />
            <Text>Gold Database:</Text>
            <Select
              value={selectedDb}
              onChange={setSelectedDb}
              loading={loadingDbs}
              placeholder="Chọn Gold database"
              style={{ minWidth: 250 }}
            >
              {goldDatabases.map((db) => (
                <Select.Option key={db.database} value={db.database}>
                  {db.database}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <Text className="block mb-1">Loại biểu đồ:</Text>
            <Radio.Group value={chartType} onChange={(e) => setChartType(e.target.value)}>
              {CHART_TYPES.map((t) => (
                <Radio.Button key={t.value} value={t.value}>{t.label}</Radio.Button>
              ))}
            </Radio.Group>
          </div>

          <TextArea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Mô tả biểu đồ cần vẽ... (VD: Biểu đồ tròn tỷ lệ doanh thu theo sản phẩm)"
            autoSize={{ minRows: 2, maxRows: 4 }}
          />

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={handleGenerate}
            loading={loading}
            disabled={!selectedDb || !question.trim()}
            size="large"
          >
            Tạo biểu đồ
          </Button>
        </div>
      </Card>

      {result && (
        <Card size="small">
          <div className="mb-2">
            <Text type="secondary">SQL: </Text>
            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{result.sql_query}</code>
          </div>
          <Text type="secondary" className="block mb-3">{result.data_summary}</Text>
          <PlotlyChartView chart={result.chart_config} height={500} />
        </Card>
      )}
    </div>
  );
}
