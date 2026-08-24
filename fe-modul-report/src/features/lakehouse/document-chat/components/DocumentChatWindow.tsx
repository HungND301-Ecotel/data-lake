import { useRef, useEffect, useState } from "react";
import { Card, Input, Button, Upload, Typography, Empty, Tag, Spin } from "antd";
import { SendOutlined, UploadOutlined, DeleteOutlined, FileOutlined } from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import type { DocChatMessage } from "../types/documentChat";

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  messages: DocChatMessage[];
  loading: boolean;
  sessionId: string | null;
  documentName: string | null;
  onSend: (query: string, file?: File) => void;
  onReset: () => void;
  datalakeBaseUrl?: string;
}

export default function DocumentChatWindow({
  messages, loading, sessionId, documentName, onSend, onReset, datalakeBaseUrl,
}: Props) {
  const [input, setInput] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input.trim(), pendingFile || undefined);
      setInput("");
      setPendingFile(null);
    }
  };

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          Document Chat
          {documentName && <Tag icon={<FileOutlined />} color="green">{documentName}</Tag>}
          {sessionId && <Tag className="text-xs">Session: {sessionId.substring(0, 8)}</Tag>}
        </span>
      }
      size="small"
      extra={<Button size="small" icon={<DeleteOutlined />} onClick={onReset}>Mới</Button>}
    >
      <div className="overflow-auto mb-3" style={{ maxHeight: "calc(100vh - 380px)", minHeight: 300 }}>
        {messages.length === 0 ? (
          <Empty description={sessionId ? "Tiếp tục hội thoại..." : "Upload document và đặt câu hỏi"} />
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === "user" ? "bg-blue-50" : "bg-gray-50"}`}>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
                {msg.chart && (
                  <img
                    src={`${datalakeBaseUrl || ""}${msg.chart.chart_url}`}
                    alt={msg.chart.title}
                    className="max-w-full rounded mt-2"
                  />
                )}
              </div>
            </div>
          ))
        )}
        {loading && <div className="text-center py-2"><Spin size="small" /> <Text type="secondary">Đang xử lý...</Text></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 items-end">
        {!sessionId && (
          <Upload
            maxCount={1}
            showUploadList={false}
            beforeUpload={(file) => { setPendingFile(file); return false; }}
          >
            <Button icon={<UploadOutlined />} type={pendingFile ? "primary" : "default"}>
              {pendingFile ? pendingFile.name.substring(0, 15) : "File"}
            </Button>
          </Upload>
        )}
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={sessionId ? "Tiếp tục hỏi..." : "Upload file và nhập câu hỏi..."}
          autoSize={{ minRows: 1, maxRows: 3 }}
          onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); handleSend(); } }}
          disabled={loading || (!sessionId && !pendingFile)}
          className="flex-1"
        />
        <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={loading} disabled={!input.trim()} />
      </div>
    </Card>
  );
}
