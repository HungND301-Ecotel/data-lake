import { useState } from "react";
import { Button } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { useChat } from "../hooks/useChat";
import ChatWindow from "../components/ChatWindow";
import ConversationList from "../components/ConversationList";

const AiChatPage: React.FC = () => {
  const {
    messages,
    loading,
    sessionId,
    sessions,
    sessionsLoading,
    sendMessage,
    clearHistory,
    switchSession,
    startNewChat,
    deleteSession,
  } = useChat();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-[calc(100vh-160px)]">
      {/* Sidebar */}
      <div
        className="transition-all duration-300 overflow-hidden flex-shrink-0"
        style={{ width: sidebarOpen ? 300 : 0 }}
      >
        <div style={{ width: 300 }} className="h-full">
          <ConversationList
            sessions={sessions}
            currentSessionId={sessionId}
            loading={sessionsLoading}
            onSelect={switchSession}
            onNewChat={startNewChat}
            onDelete={deleteSession}
          />
        </div>
      </div>

      {/* Toggle + Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-2 py-1">
          <Button
            type="text"
            icon={sidebarOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          />
        </div>
        <div className="flex-1 px-2 pb-2">
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
