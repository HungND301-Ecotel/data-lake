import { useState, useRef, useEffect } from "react";
import { Button, Input, Tag } from "antd";
import { SendOutlined } from "@ant-design/icons";

const { TextArea } = Input;

interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
  placeholder?: string;
  suggestions?: string[];
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  loading,
  placeholder = "Hỏi về dữ liệu của bạn...",
  suggestions = [],
}) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (message.trim() && !loading) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {suggestions.length > 0 && !message && (
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestions.map((suggestion, index) => (
            <Tag
              key={index}
              color="blue"
              className="cursor-pointer"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </Tag>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <TextArea
          ref={textareaRef as React.Ref<any>}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
          autoSize={{ minRows: 1, maxRows: 4 }}
          maxLength={2000}
          showCount
          className="flex-1"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSubmit}
          disabled={!message.trim() || loading}
          loading={loading}
          size="large"
        />
      </div>
    </div>
  );
};

export default ChatInput;
