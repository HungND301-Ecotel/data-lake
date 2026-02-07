import { useRef, useEffect, useState } from "react";
import { Card, Input, Button, Typography, Empty, Tag, Spin } from "antd";
import { SendOutlined, DeleteOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import type { RagMessage } from "../types/rag";

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  messages: RagMessage[];
  loading: boolean;
  onSend: (query: string) => void;
  onClear: () => void;
  datalakeBaseUrl?: string;
}

export default function RagChatWindow({ messages, loading, onSend, onClear, datalakeBaseUrl }: Props) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input.trim());
      setInput("");
    }
  };

  return (
    <Card
      title="RAG Chat"
      size="small"
      extra={
        messages.length > 0 && (
          <Button size="small" icon={<DeleteOutlined />} onClick={onClear}>Xoá</Button>
        )
      }
      className="h-full flex flex-col"
    >
      <div className="flex-1 overflow-auto mb-3" style={{ maxHeight: "calc(100vh - 380px)", minHeight: 300 }}>
        {messages.length === 0 ? (
          <Empty description="Hỏi câu hỏi về documents đã ingest" />
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === "user" ? "bg-blue-50 text-right" : "bg-gray-50"
              }`}>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2">
                    <Text type="secondary" className="text-xs">Nguồn: </Text>
                    {msg.sources.map((s, j) => (
                      <Tag key={j} className="text-xs">{s.file_id.substring(0, 8)}</Tag>
                    ))}
                  </div>
                )}
                {msg.chart && (
                  <div className="mt-2">
                    <img
                      src={`${datalakeBaseUrl || ""}${msg.chart.chart_url}`}
                      alt={msg.chart.title}
                      className="max-w-full rounded"
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && <div className="text-center py-2"><Spin size="small" /> <Text type="secondary">Đang xử lý...</Text></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2">
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi..."
          autoSize={{ minRows: 1, maxRows: 3 }}
          onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
          disabled={loading}
          className="flex-1"
        />
        <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading} disabled={!input.trim()} />
      </div>
    </Card>
  );
}
