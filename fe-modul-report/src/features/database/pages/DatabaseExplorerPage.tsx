import { useEffect } from "react";
import { Card, Row, Col, Table, Typography, Alert, Select, Tooltip } from "antd";
import { useDatabaseExplorer } from "../hooks/useDatabaseExplorer";
import DatabaseSelector from "../components/DatabaseSelector";
import SchemaTree from "../components/SchemaTree";
import NaturalQueryInput from "../components/NaturalQueryInput";
import { useServers } from "../../server/hooks/useServers";

const { Text } = Typography;

export default function DatabaseExplorerPage() {
  const { servers } = useServers();
  const {
    databases, selectedDb, schema, queryResult,
    loading, schemaLoading, queryLoading, error,
    fetchDatabases, selectDatabase, queryNatural, setServerId,
  } = useDatabaseExplorer();

  const handleServerChange = (serverId: string) => {
    setServerId(serverId);
    fetchDatabases(serverId);
  };

  useEffect(() => {
    const defaultServer = servers.find((s) => s.is_default);
    if (defaultServer) {
      handleServerChange(defaultServer.id);
    }
  }, [servers]);

  const generatedQuery = queryResult && "generated_query" in queryResult ? queryResult.generated_query : null;

  const queryColumns = queryResult?.columns?.map((col) => ({
    title: col,
    dataIndex: col,
    key: col,
    ellipsis: true,
    render: (val: unknown) => {
      if (val === null || val === undefined) return <Text type="secondary" italic>NULL</Text>;
      return <Tooltip title={String(val)}><span>{String(val)}</span></Tooltip>;
    },
  })) || [];

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" closable />}

      <Row gutter={[16, 16]}>
        {/* Sidebar */}
        <Col xs={24} lg={6}>
          <Card title="Cơ sở dữ liệu" className="h-full" size="small">
            <div className="space-y-3">
              <Select
                placeholder="Chọn Server"
                className="w-full"
                onChange={handleServerChange}
                options={servers.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.host})`,
                }))}
                defaultValue={servers.find((s) => s.is_default)?.id}
              />

              <DatabaseSelector
                databases={databases}
                selectedDb={selectedDb}
                loading={loading}
                onSelect={selectDatabase}
              />

              <div className="mt-4" style={{ maxHeight: "calc(100vh - 380px)", overflow: "auto" }}>
                <SchemaTree schema={schema} loading={schemaLoading} />
              </div>
            </div>
          </Card>
        </Col>

        {/* Main Content */}
        <Col xs={24} lg={18}>
          <div className="space-y-4">
            <Card title="Truy vấn ngôn ngữ tự nhiên" size="small">
              <NaturalQueryInput
                database={selectedDb}
                loading={queryLoading}
                generatedQuery={generatedQuery}
                onQuery={(q) => selectedDb && queryNatural(q, selectedDb)}
              />
            </Card>

            {queryResult && queryResult.columns.length > 0 && (
              <Card
                title="Kết quả truy vấn"
                size="small"
                extra={
                  <Text type="secondary">
                    {queryResult.rows.length} / {queryResult.total_rows} hàng
                    {" | "}
                    {queryResult.columns.length} cột
                  </Text>
                }
              >
                {queryResult.error ? (
                  <Alert message={queryResult.error} type="error" />
                ) : (
                  <Table
                    columns={queryColumns}
                    dataSource={queryResult.rows.map((row, i) => ({ ...row, _key: i }))}
                    rowKey="_key"
                    size="small"
                    scroll={{ x: queryResult.columns.length * 150 }}
                    pagination={{ pageSize: 50, showSizeChanger: true, showTotal: (t) => `Tổng: ${t}` }}
                  />
                )}
              </Card>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}
