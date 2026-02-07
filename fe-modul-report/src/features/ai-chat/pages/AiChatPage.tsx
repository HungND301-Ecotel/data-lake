import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Tabs, Select, Card, Tag } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RobotOutlined,
  DatabaseOutlined,
  FileSearchOutlined,
} from "@ant-design/icons";
import { useChat } from "../hooks/useChat";
import { useServers } from "../../server/hooks/useServers";
import { useDatabaseExplorer } from "../../database/hooks/useDatabaseExplorer";
import { usePipeline } from "../../lakehouse/pipeline/hooks/usePipeline";
import { useRagSearch, useRagIngest } from "../../lakehouse/rag/hooks/useRagChat";
import ChatWindow from "../components/ChatWindow";
import ConversationList from "../components/ConversationList";
import SearchPanel from "../../lakehouse/rag/components/SearchPanel";
import IngestButton from "../../lakehouse/rag/components/IngestButton";
import type { ChatMode } from "../types/chat";

const AiChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get("mode") as ChatMode) || "general";
  const initialDb = searchParams.get("database") || undefined;
  const initialServer = searchParams.get("server") || undefined;

  const {
    messages,
    loading,
    sessionId,
    sessions,
    sessionsLoading,
    mode,
    context,
    sendMessage,
    clearHistory,
    switchSession,
    startNewChat,
    deleteSession,
    setMode,
    setDatabase,
    setServerId,
  } = useChat({
    mode: initialMode,
    database: initialDb,
    serverId: initialServer,
  });

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Server and database selection for database mode
  const { servers } = useServers();
  const { databases, fetchDatabases } = useDatabaseExplorer();

  // RAG hooks
  const { results: ragResults, loading: ragSearchLoading, search: ragSearch } = useRagSearch();
  const { loading: ragIngestLoading, ingest: ragIngest } = useRagIngest();
  const { rawFiles } = usePipeline();

  // Fetch databases when server changes
  useEffect(() => {
    if (context.serverId && mode === "database") {
      fetchDatabases(context.serverId);
    }
  }, [context.serverId, mode]);

  // Set default server
  useEffect(() => {
    if (mode === "database" && !context.serverId && servers.length > 0) {
      const defaultServer = servers.find((s) => s.is_default) || servers[0];
      setServerId(defaultServer.id);
    }
  }, [mode, servers, context.serverId]);

  const handleModeChange = (newMode: string) => {
    setMode(newMode as ChatMode);
  };

  const tabItems = [
    {
      key: "general",
      label: (
        <span className="flex items-center gap-2">
          <RobotOutlined />
          Chat AI
        </span>
      ),
    },
    {
      key: "database",
      label: (
        <span className="flex items-center gap-2">
          <DatabaseOutlined />
          Database
        </span>
      ),
    },
    {
      key: "rag",
      label: (
        <span className="flex items-center gap-2">
          <FileSearchOutlined />
          Documents
        </span>
      ),
    },
  ];

  return (
    <div className="flex h-[calc(100vh-160px)]">
      {/* Sidebar */}
      <div
        className="transition-all duration-300 overflow-hidden flex-shrink-0"
        style={{ width: sidebarOpen ? 300 : 0 }}
      >
        <div style={{ width: 300 }} className="h-full flex flex-col">
          {mode === "rag" ? (
            <div className="p-3 space-y-3 overflow-y-auto h-full">
              <IngestButton
                rawFiles={rawFiles}
                loading={ragIngestLoading}
                onIngest={ragIngest}
              />
              <SearchPanel
                results={ragResults}
                loading={ragSearchLoading}
                onSearch={ragSearch}
              />
            </div>
          ) : (
            <ConversationList
              sessions={sessions}
              currentSessionId={sessionId}
              loading={sessionsLoading}
              onSelect={switchSession}
              onNewChat={startNewChat}
              onDelete={deleteSession}
            />
          )}
        </div>
      </div>

      {/* Toggle + Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with tabs */}
        <div className="px-2 py-1 border-b border-gray-200 flex items-center gap-2">
          <Button
            type="text"
            icon={sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          />
          <Tabs
            activeKey={mode}
            onChange={handleModeChange}
            items={tabItems}
            size="small"
            className="flex-1"
          />
        </div>

        {/* Context selector for database mode */}
        {mode === "database" && (
          <Card size="small" className="mx-2 mt-2">
            <div className="flex items-center gap-3">
              <Select
                placeholder="Chọn Server"
                className="w-48"
                value={context.serverId}
                onChange={(val) => {
                  setServerId(val);
                  setDatabase(undefined);
                }}
                options={servers.map((s) => ({
                  value: s.id,
                  label: `${s.name} (${s.host})`,
                }))}
              />
              <Select
                placeholder="Chọn Database"
                className="w-48"
                value={context.database}
                onChange={(val) => setDatabase(val)}
                options={databases.map((db) => ({
                  value: db,
                  label: db,
                }))}
                disabled={!context.serverId}
              />
              {context.database && (
                <Tag color="blue" className="ml-2">
                  {context.database}
                </Tag>
              )}
            </div>
          </Card>
        )}

        {/* Mode indicator for RAG */}
        {mode === "rag" && (
          <Card size="small" className="mx-2 mt-2">
            <div className="flex items-center gap-2">
              <FileSearchOutlined className="text-green-600" />
              <span className="text-sm text-gray-600">
                Chat với documents đã được ingest vào FAISS vector store
              </span>
            </div>
          </Card>
        )}

        {/* Chat window */}
        <div className="flex-1 px-2 pb-2 mt-2">
          <ChatWindow
            messages={messages}
            loading={loading}
            sessionId={sessionId}
            onSend={sendMessage}
            onClear={clearHistory}
          />
        </div>
      </div>
    </div>
  );
};

export default AiChatPage;
