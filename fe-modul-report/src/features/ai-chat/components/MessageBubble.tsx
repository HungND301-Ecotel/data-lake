import { Avatar, Tag, Typography, Tooltip, message as antMessage } from "antd";
import {
  UserOutlined,
  RobotOutlined,
  CopyOutlined,
  CheckOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "../types/chat";
import ChatChart from "./ChatChart";
import ChatDataTable from "./ChatDataTable";
import DbQueryTable from "./DbQueryTable";

const { Text } = Typography;

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "human" || message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    antMessage.success("Đã sao chép");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex gap-3 mb-4 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <Avatar
        size={36}
        icon={isUser ? <UserOutlined /> : <RobotOutlined />}
        style={{
          backgroundColor: isUser ? "#722ed1" : "#1677ff",
          flexShrink: 0,
        }}
      />

      <div className={`max-w-[80%] ${isUser ? "text-right" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 inline-block text-left ${
            isUser
              ? "bg-blue-50 border border-blue-200"
              : "bg-white border border-gray-200"
          }`}
        >
          {isUser ? (
            <p className="mb-0 whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="markdown-content prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {message.chart?.chart_json && (
            <ChatChart chart={message.chart} />
          )}

          {message.data && message.data.rows?.length > 0 && (
            <ChatDataTable data={message.data} />
          )}

          {message.db_query && message.db_query.rows?.length > 0 && (
            <DbQueryTable dbQuery={message.db_query} />
          )}

          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <Text type="secondary" className="text-xs block mb-1">
                Nguồn:
              </Text>
              <div className="flex flex-wrap gap-1">
                {message.sources.map((source, index) => (
                  <Tag key={index} icon={<FileTextOutlined />} color="blue">
                    {source.metadata?.source || "Document"}
                    {source.metadata?.table && ` (${source.metadata.table})`}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-2 pt-1">
            <Text type="secondary" className="text-xs">
              {message.timestamp
                ? new Date(message.timestamp).toLocaleTimeString()
                : ""}
            </Text>
            {!isUser && (
              <Tooltip title="Sao chép">
                <button
                  onClick={handleCopy}
                  className="ml-2 text-gray-400 hover:text-gray-600 transition-colors border-0 bg-transparent cursor-pointer"
                >
                  {copied ? (
                    <CheckOutlined style={{ color: "#52c41a", fontSize: 14 }} />
                  ) : (
                    <CopyOutlined style={{ fontSize: 14 }} />
                  )}
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
