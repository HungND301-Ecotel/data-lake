import { Button, List, Empty, Skeleton, Popconfirm, Typography, Badge } from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  MessageOutlined,
  UserOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import type { ChatSession } from "../types/chat";

const { Text } = Typography;

interface ConversationListProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  loading: boolean;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onDelete: (sessionId: string) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  sessions,
  currentSessionId,
  loading,
  onSelect,
  onNewChat,
  onDelete,
}) => {
  const truncateMessage = (msg?: string, maxLength = 35) => {
    if (!msg) return "Cuộc hội thoại mới";
    return msg.length > maxLength ? msg.slice(0, maxLength) + "..." : msg;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 border-r border-gray-200">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onNewChat}
          block
        >
          Chat mới
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="space-y-3 p-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} active avatar paragraph={{ rows: 1 }} />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có cuộc hội thoại"
            className="mt-8"
          />
        ) : (
          <List
            dataSource={sessions}
            renderItem={(session) => {
              const isActive = session.session_id === currentSessionId;
              return (
                <List.Item
                  className={`!px-3 !py-2 cursor-pointer rounded-lg mb-1 transition-all ${
                    isActive
                      ? "bg-blue-50 border border-blue-200"
                      : "hover:bg-gray-100 border border-transparent"
                  }`}
                  onClick={() => onSelect(session.session_id)}
                  extra={
                    <Popconfirm
                      title="Xóa cuộc hội thoại này?"
                      onConfirm={(e) => {
                        e?.stopPropagation();
                        onDelete(session.session_id);
                      }}
                      onCancel={(e) => e?.stopPropagation()}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <MessageOutlined
                        style={{
                          fontSize: 18,
                          color: isActive ? "#1677ff" : "#8c8c8c",
                        }}
                      />
                    }
                    title={
                      <Text
                        strong={isActive}
                        style={{
                          color: isActive ? "#1677ff" : undefined,
                          fontSize: 13,
                        }}
                      >
                        {truncateMessage(session.last_message)}
                      </Text>
                    }
                    description={
                      <div className="flex items-center gap-2">
                        {session.last_role === "human" ? (
                          <UserOutlined className="text-xs" />
                        ) : (
                          <RobotOutlined className="text-xs" />
                        )}
                        <Text type="secondary" className="text-xs">
                          {session.message_count} tin nhắn
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MessageOutlined />
          <span>{sessions.length} cuộc hội thoại</span>
        </div>
      </div>
    </div>
  );
};

export default ConversationList;
