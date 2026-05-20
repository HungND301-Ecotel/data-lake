import { useState } from "react";
import { Button, Tag, message } from "antd";
import { ApiOutlined } from "@ant-design/icons";
import type { TestConnectionResult } from "../types/server";

interface Props {
  serverId: string;
  onTest: (serverId: string) => Promise<TestConnectionResult>;
}

export default function TestConnectionButton({ serverId, onTest }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestConnectionResult | null>(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await onTest(serverId);
      setResult(res);
      if (res.success) {
        message.success(res.message);
      } else {
        message.error(res.message);
      }
    } catch {
      message.error("Lỗi khi test kết nối");
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        size="small"
        icon={<ApiOutlined />}
        loading={loading}
        onClick={handleTest}
      >
        Test
      </Button>
      {result && (
        <Tag color={result.success ? "success" : "error"}>
          {result.success ? `OK (${result.databases.length} DBs)` : "Thất bại"}
        </Tag>
      )}
    </span>
  );
}
