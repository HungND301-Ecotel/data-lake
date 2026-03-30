import { useState, useRef, useEffect } from "react";
import { Input, Button, Card, Typography, Table, Tag, Space, Empty, Spin } from "antd";
import { SendOutlined, CodeOutlined, BarChartOutlined, ClearOutlined, LoadingOutlined } from "@ant-design/icons";
import type { ChatMessage } from "../hooks/useDbChat";
import PlotlyChartView from "./PlotlyChartView";

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ChatPanelProps {
  messages: ChatMessage[];
  sending: boolean;
  onSend: (question: string) => void;
  onClear: () => void;
}

function DataTable({ data, columns }: { data: Record<string, unknown>[]; columns: string[] }) {
  const tableColumns = columns.map((col) => ({
    title: col,
    dataIndex: col,
    key: col,
    ellipsis: true,
    render: (v: unknown) => (v !== null && v !== undefined ? String(v) : <Text type="secondary">NULL</Text>),
  }));

  return (
    <Table
      dataSource={data.map((row, i) => ({ ...row, _key: i }))}
      columns={tableColumns}
      rowKey="_key"
      size="small"
      scroll={{ x: "max-content" }}
      pagination={{ pageSize: 5, size: "small" }}
      className="mt-2"
    />
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  const [showSql, setShowSql] = useState(false);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div className={`max-w-[85%] ${isUser ? "bg-blue-500 text-white" : "bg-gray-100"} rounded-2xl px-4 py-3`}>
        {/* Streaming status indicator */}
        {!isUser && msg.streaming && msg.status && (
          <div className="mb-2 flex items-center gap-2">
            <Spin indicator={<LoadingOutlined style={{ fontSize: 14 }} />} size="small" />
            <Tag color="processing">{msg.status}</Tag>
          </div>
        )}

        {/* Answer content - shows incrementally during streaming */}
        {msg.content && (
          <Paragraph className={`mb-1 ${isUser ? "text-white" : ""}`} style={{ marginBottom: 4, whiteSpace: "pre-wrap" }}>
            {msg.content}
            {!isUser && msg.streaming && <span className="animate-pulse">|</span>}
          </Paragraph>
        )}

        {/* SQL query toggle */}
        {!isUser && msg.sqlQuery && (
          <>
            <Button
              type="link"
              size="small"
              icon={<CodeOutlined />}
              onClick={() => setShowSql(!showSql)}
              className="p-0 h-auto"
            >
              {showSql ? "Ẩn SQL" : "Xem SQL"}
            </Button>
            {showSql && (
              <pre className="bg-gray-800 text-green-400 text-xs p-2 rounded mt-1 overflow-x-auto">
                {msg.sqlQuery}
              </pre>
            )}
          </>
        )}

        {/* Data table */}
        {!isUser && msg.data && msg.columns && msg.data.length > 0 && (
          <div className="mt-2">
            <Tag icon={<BarChartOutlined />} color="processing">
              {msg.totalRows} dòng kết quả
            </Tag>
            <DataTable data={msg.data} columns={msg.columns} />
          </div>
        )}

        {/* Chart */}
        {!isUser && msg.chart && (
          <div className="mt-2">
            <PlotlyChartView chart={msg.chart} />
          </div>
        )}

        <Text type="secondary" className="text-xs block mt-1">
          {new Date(msg.timestamp).toLocaleTimeString("vi-VN")}
        </Text>
      </div>
    </div>
  );
}

export default function ChatPanel({ messages, sending, onSend, onClear }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sending) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <Card
      className="flex flex-col"
      styles={{ body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" } }}
    >
      <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 400, maxHeight: "60vh" }}>
        {messages.length === 0 && (
          <Empty description="Hỏi bất kỳ câu hỏi nào về dữ liệu Gold database" className="mt-16" />
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3">
        <Space.Compact className="w-full">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Hỏi về dữ liệu... (VD: Thống kê số lượng khách hàng theo thành phố)"
            autoSize={{ minRows: 1, maxRows: 3 }}
            disabled={sending}
          />
          <Button type="primary" icon={<SendOutlined />} onClick={handleSend} loading={sending} />
          <Button icon={<ClearOutlined />} onClick={onClear} title="Xóa hội thoại" />
        </Space.Compact>
      </div>
    </Card>
  );
}
