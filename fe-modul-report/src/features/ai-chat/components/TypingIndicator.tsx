import { RobotOutlined } from "@ant-design/icons";
import { Avatar } from "antd";

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex gap-3">
      <Avatar
        size={36}
        icon={<RobotOutlined />}
        style={{ backgroundColor: "#1677ff", flexShrink: 0 }}
      />
      <div className="bg-gray-100 rounded-2xl px-4 py-3 inline-flex items-center gap-1.5">
        <span className="typing-dot h-2 w-2 rounded-full bg-blue-500 inline-block" />
        <span className="typing-dot h-2 w-2 rounded-full bg-blue-500 inline-block" />
        <span className="typing-dot h-2 w-2 rounded-full bg-blue-500 inline-block" />
      </div>
    </div>
  );
};

export default TypingIndicator;
