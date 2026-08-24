import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Empty,
  Input,
  List,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  message as antdMessage,
} from "antd";
import {
  DislikeOutlined,
  LikeOutlined,
  PlusOutlined,
  SendOutlined,
} from "@ant-design/icons";
import aiChatApi, {
  type ChatAnswer,
  type ChatCitation,
  type ConversationMessage,
  type ConversationSummary,
} from "../api/aiChatApi";
import { formatTime } from "../components/statusTags";

const { Text, Paragraph } = Typography;

const CONFIDENCE_COLOR: Record<string, string> = {
  HIGH: "green",
  MEDIUM: "gold",
  LOW: "orange",
};

/**
 * Trạng thái trả lời do worker quyết định. Giao diện phải hiển thị đúng lý do
 * từ chối thay vì im lặng, để người dùng biết đây là quyết định chính sách chứ
 * không phải lỗi hệ thống.
 */
const STATUS_ALERT: Record<string, { type: "warning" | "error"; text: string }> = {
  REFUSED_NO_EVIDENCE: {
    type: "warning",
    text: "Không đủ căn cứ trong kho dữ liệu. Hệ thống từ chối trả lời thay vì suy đoán.",
  },
  REFUSED_MODEL_NOT_ALLOWED: {
    type: "error",
    text: "Không có mô hình nào được phép xử lý dữ liệu ở mức độ mật này.",
  },
  BLOCKED_POLICY: {
    type: "error",
    text: "Nội dung bị chặn bởi chính sách bảo mật.",
  },
};

export default function GovernedChatPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const result = await aiChatApi.listConversations();
    setConversations(result.items);
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      const detail = await aiChatApi.getConversation(conversationId);
      setMessages(detail.messages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
    else setMessages([]);
  }, [activeId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = question.trim();
    if (!text) return;

    setSending(true);
    setQuestion("");
    // Hiển thị ngay câu hỏi để người dùng thấy phản hồi tức thì.
    setMessages((prev) => [
      ...prev,
      {
        message_id: `pending-${Date.now()}`,
        role: "user",
        content: text,
        status: null,
        confidence: null,
        warnings: [],
        latency_ms: null,
        created_at: new Date().toISOString(),
        citations: [],
        tools: [],
      },
    ]);

    try {
      const answer: ChatAnswer = await aiChatApi.ask({
        question: text,
        conversation_id: activeId || undefined,
      });
      if (!activeId) {
        setActiveId(answer.conversation_id);
        await loadConversations();
      }
      await loadMessages(answer.conversation_id);
    } catch {
      // Khung lỗi đã được hiển thị bởi interceptor.
      await (activeId ? loadMessages(activeId) : Promise.resolve());
    } finally {
      setSending(false);
    }
  };

  const rate = async (messageId: string, rating: "UP" | "DOWN") => {
    await aiChatApi.sendFeedback(messageId, rating);
    antdMessage.success("Cảm ơn phản hồi của bạn");
  };

  return (
    <div className="flex gap-4" style={{ height: "calc(100vh - 160px)" }}>
      <Card
        title="Hội thoại"
        size="small"
        style={{ width: 280, flexShrink: 0, overflow: "auto" }}
        extra={
          <Button size="small" icon={<PlusOutlined />} onClick={() => setActiveId(null)}>
            Mới
          </Button>
        }
      >
        <List
          size="small"
          dataSource={conversations}
          locale={{ emptyText: "Chưa có hội thoại" }}
          renderItem={(item) => (
            <List.Item
              onClick={() => setActiveId(item.conversation_id)}
              className={`cursor-pointer ${
                activeId === item.conversation_id ? "bg-blue-50" : ""
              }`}
            >
              <Space direction="vertical" size={0} className="w-full">
                <Text ellipsis className="text-sm">
                  {item.title || "Hội thoại"}
                </Text>
                <Space size={4}>
                  <Text type="secondary" className="text-xs">
                    {formatTime(item.updated_at)}
                  </Text>
                  {item.max_security_level >= 3 && <Tag color="red">Mật</Tag>}
                </Space>
              </Space>
            </List.Item>
          )}
        />
      </Card>

      <Card
        title="Hỏi đáp trên kho dữ liệu"
        className="flex-1 flex flex-col"
        styles={{ body: { display: "flex", flexDirection: "column", flex: 1, minHeight: 0 } }}
      >
        <Alert
          type="info"
          showIcon
          className="mb-3"
          message="Câu trả lời chỉ dựa trên tài liệu bạn được phép đọc, và luôn kèm nguồn."
          description="Hệ thống từ chối trả lời khi không đủ căn cứ, và cảnh báo nếu phát hiện số liệu không có trong tài liệu nguồn."
        />

        <div className="flex-1 overflow-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spin />
            </div>
          ) : messages.length === 0 ? (
            <Empty description="Đặt câu hỏi về tài liệu trong kho" />
          ) : (
            messages.map((item) => (
              <MessageBlock key={item.message_id} message={item} onRate={rate} />
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <div className="pt-3">
          <Space.Compact className="w-full">
            <Input.TextArea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Nhập câu hỏi. Enter để gửi, Shift+Enter để xuống dòng."
              autoSize={{ minRows: 2, maxRows: 5 }}
              disabled={sending}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={sending}
              onClick={send}
              style={{ height: "auto" }}
            >
              Gửi
            </Button>
          </Space.Compact>
        </div>
      </Card>
    </div>
  );
}

function MessageBlock({
  message,
  onRate,
}: {
  message: ConversationMessage;
  onRate: (messageId: string, rating: "UP" | "DOWN") => void;
}) {
  const isUser = message.role === "user";
  const alert = message.status ? STATUS_ALERT[message.status] : undefined;

  return (
    <div className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] ${isUser ? "" : "w-full"}`}>
        <div
          className={`p-3 rounded-lg ${
            isUser ? "bg-blue-50" : "bg-gray-50 border border-gray-100"
          }`}
        >
          {alert && (
            <Alert type={alert.type} showIcon className="mb-2" message={alert.text} />
          )}

          {message.content && (
            <Paragraph className="mb-0 whitespace-pre-wrap">{message.content}</Paragraph>
          )}

          {!isUser && message.warnings.length > 0 && (
            <Alert
              type="warning"
              className="mt-2"
              message={
                <ul className="m-0 pl-4">
                  {message.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              }
            />
          )}

          {!isUser && message.citations.length > 0 && (
            <div className="mt-3">
              <Text strong className="text-xs">
                Nguồn
              </Text>
              {message.citations.map((citation, index) => (
                <CitationRow key={citation.chunk_id || index} index={index} citation={citation} />
              ))}
            </div>
          )}
        </div>

        {!isUser && (
          <Space size={8} className="mt-1" wrap>
            {message.confidence && (
              <Tooltip title="Độ tin cậy dựa trên số trích dẫn và mức khớp của bằng chứng">
                <Tag color={CONFIDENCE_COLOR[message.confidence]}>
                  Tin cậy: {message.confidence}
                </Tag>
              </Tooltip>
            )}
            {message.tools.map((tool) => (
              <Tooltip
                key={tool.tool}
                title={`${tool.result_count} kết quả, ${tool.trimmed_count} bị loại do không đủ quyền`}
              >
                <Tag>{tool.tool}</Tag>
              </Tooltip>
            ))}
            {message.latency_ms != null && (
              <Text type="secondary" className="text-xs">
                {message.latency_ms} ms
              </Text>
            )}
            {message.status === "ANSWERED" && (
              <>
                <Button
                  size="small"
                  type="text"
                  icon={<LikeOutlined />}
                  onClick={() => onRate(message.message_id, "UP")}
                />
                <Button
                  size="small"
                  type="text"
                  icon={<DislikeOutlined />}
                  onClick={() => onRate(message.message_id, "DOWN")}
                />
              </>
            )}
          </Space>
        )}
      </div>
    </div>
  );
}

function CitationRow({ citation, index }: { citation: ChatCitation; index: number }) {
  return (
    <div className="mt-2 p-2 bg-white rounded border border-gray-200">
      <Space size={6} wrap>
        <Tag color="green">S{index + 1}</Tag>
        <Text className="text-xs" strong>
          {citation.original_name || citation.object_id.slice(0, 8)}
        </Text>
        {citation.locator && (
          <Text type="secondary" className="text-xs">
            {citation.locator}
          </Text>
        )}
        {citation.score != null && (
          <Text type="secondary" className="text-xs">
            khớp {Math.round(citation.score * 100)}%
          </Text>
        )}
      </Space>
      {citation.snippet && (
        <Paragraph
          className="mt-1 mb-0 text-xs"
          type="secondary"
          ellipsis={{ rows: 3, expandable: true, symbol: "xem thêm" }}
        >
          {citation.snippet}
        </Paragraph>
      )}
    </div>
  );
}
