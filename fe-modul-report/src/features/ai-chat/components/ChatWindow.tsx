import { useRef, useEffect } from "react";
import { Button, Empty, Typography } from "antd";
import { DeleteOutlined, MessageOutlined } from "@ant-design/icons";
import type { ChatMessage } from "../types/chat";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ChatInput from "./ChatInput";

const { Title, Text } = Typography;

interface ChatWindowProps {
  messages: ChatMessage[];
  loading: boolean;
  sessionId: string | null;
  onSend: (message: string) => void;
  onClear: () => void;
}

const suggestions = [
  "Doanh thu tháng này là bao nhiêu?",
  "So sánh doanh thu các quý",
  "Top 10 sản phẩm bán chạy",
  "Biểu đồ khách hàng theo khu vực",
];

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  loading,
  sessionId,
  onSend,
  onClear,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center">
            <MessageOutlined className="text-white text-lg" />
          </div>
          <div>
            <Title level={5} className="!mb-0">
              AI Assistant
            </Title>
            {sessionId && (
              <Text type="secondary" className="text-xs">
                Phiên: {sessionId.slice(0, 8)}...
              </Text>
            )}
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={onClear}
          >
            Xóa
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Title level={4}>Hỏi đáp với dữ liệu của bạn</Title>
                  <Text type="secondary">
                    Tôi có thể giúp bạn phân tích dữ liệu, tạo biểu đồ, và trả
                    lời các câu hỏi về doanh nghiệp.
                  </Text>
                </div>
              }
            />
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <MessageBubble key={msg.id || index} message={msg} />
            ))}
            {loading && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={onSend}
        loading={loading}
        suggestions={messages.length === 0 ? suggestions : []}
      />
    </div>
  );
};

export default ChatWindow;
