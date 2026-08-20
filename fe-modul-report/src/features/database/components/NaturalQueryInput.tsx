import { useState } from "react";
import { Input, Button, Typography, Card } from "antd";
import { SearchOutlined, CopyOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface Props {
  database: string | null;
  loading: boolean;
  generatedQuery?: string | null;
  onQuery: (question: string) => void;
}

export default function NaturalQueryInput({ database, loading, generatedQuery, onQuery }: Props) {
  const [question, setQuestion] = useState("");

  const handleSubmit = () => {
    if (question.trim() && database) {
      onQuery(question.trim());
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <TextArea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={database ? "Nhập câu hỏi bằng tiếng Việt..." : "Chọn database trước"}
          autoSize={{ minRows: 2, maxRows: 4 }}
          disabled={!database}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="flex-1"
        />
        <Button
          type="primary"
          icon={<SearchOutlined />}
          loading={loading}
          disabled={!question.trim() || !database}
          onClick={handleSubmit}
          className="h-auto"
        >
          Truy vấn
        </Button>
      </div>

      {generatedQuery && (
        <Card size="small" className="bg-gray-50">
          <div className="flex items-center justify-between mb-1">
            <Text type="secondary" className="text-xs font-medium">SQL đã sinh:</Text>
            <Button
              size="small"
              type="text"
              icon={<CopyOutlined />}
              onClick={() => navigator.clipboard.writeText(generatedQuery)}
            />
          </div>
          <Paragraph code className="mb-0 text-sm whitespace-pre-wrap">
            {generatedQuery}
          </Paragraph>
        </Card>
      )}
    </div>
  );
}
