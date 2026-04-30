import { useState, useEffect } from "react";
import { Select, Card, Alert, Typography } from "antd";
import { RobotOutlined, DatabaseOutlined } from "@ant-design/icons";
import { useDbChat } from "../hooks/useDbChat";
import { useServer } from "../hooks/useServer";
import { dbLakehouseApi } from "../api/dbLakehouseApi";
import ChatPanel from "../components/ChatPanel";
import ServerSelector from "../components/ServerSelector";
import type { DatabaseMeta } from "../types/dbLakehouse";

const { Title, Text } = Typography;

export default function DbChatPage() {
  const { messages, sending, error, sendMessageStream, clearChat } = useDbChat();
  const { servers, defaultServer, loading: loadingServers } = useServer();
  const [serverId, setServerId] = useState<string>("");
  const activeServerId = serverId || defaultServer?.id || "";

  const [goldDatabases, setGoldDatabases] = useState<DatabaseMeta[]>([]);
  const [selectedDb, setSelectedDb] = useState<string>("");
  const [loadingDbs, setLoadingDbs] = useState(false);

  useEffect(() => {
    const fetchDbs = async () => {
      setLoadingDbs(true);
      try {
        const res = await dbLakehouseApi.listDatabases();
        const goldDbs = Object.values(res.databases || {}).filter((db) => db.layer === "gold");
        setGoldDatabases(goldDbs);
        if (goldDbs.length > 0) setSelectedDb(goldDbs[0].database);
      } catch {
        // error handled by interceptor
      } finally {
        setLoadingDbs(false);
      }
    };
    fetchDbs();
  }, []);

  const handleSend = (question: string) => {
    if (!selectedDb) return;
    sendMessageStream(question, selectedDb);
  };

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" closable />}

      <Card size="small">
        <div className="flex items-center gap-4 flex-wrap">
          <Title level={5} className="mb-0">
            <RobotOutlined className="mr-2" />
            DB Lakehouse Chatbot
          </Title>
          <ServerSelector
            servers={servers}
            value={activeServerId}
            onChange={setServerId}
            loading={loadingServers}
          />
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
                  {db.database} ({db.tables.length} bảng)
                </Select.Option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {!selectedDb && (
        <Alert message="Vui lòng chọn Gold database để bắt đầu hỏi đáp" type="info" showIcon />
      )}

      <ChatPanel
        messages={messages}
        sending={sending}
        onSend={handleSend}
        onClear={clearChat}
      />
    </div>
  );
}
