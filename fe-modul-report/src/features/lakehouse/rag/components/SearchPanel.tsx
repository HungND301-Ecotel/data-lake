import { useState } from "react";
import { Input, Button, List, Tag, Typography, Card, Progress, Empty } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { RagSearchResponse } from "../types/rag";

const { Text, Paragraph } = Typography;

interface Props {
  results: RagSearchResponse | null;
  loading: boolean;
  onSearch: (query: string, topK?: number) => void;
}

export default function SearchPanel({ results, loading, onSearch }: Props) {
  const [query, setQuery] = useState("");

  return (
    <Card title="Tìm kiếm Documents" size="small">
      <div className="flex gap-2 mb-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm kiếm..."
          onPressEnter={() => query.trim() && onSearch(query.trim())}
        />
        <Button icon={<SearchOutlined />} loading={loading} onClick={() => query.trim() && onSearch(query.trim())} />
      </div>

      {results ? (
        <List
          dataSource={results.results}
          renderItem={(item, i) => (
            <List.Item key={i}>
              <div className="w-full">
                <div className="flex items-center gap-2 mb-1">
                  <Progress type="circle" size={30} percent={Math.round(item.score * 100)} />
                  {item.raw && <Text strong>{item.raw.filename}</Text>}
                  {item.raw && <Tag className="text-xs">{item.raw.file_id.substring(0, 8)}</Tag>}
                </div>
                {item.bronze && (
                  <Paragraph ellipsis={{ rows: 2 }} className="text-sm text-gray-500 mb-1">
                    {item.bronze.extracted_text}
                  </Paragraph>
                )}
                <div>
                  {item.raw && <Tag color="blue">Raw</Tag>}
                  {item.bronze && <Tag color="orange">Bronze</Tag>}
                  {item.silver && <Tag color="green">Silver</Tag>}
                  {item.gold && item.gold.length > 0 && <Tag color="gold">Gold ({item.gold.length})</Tag>}
                </div>
              </div>
            </List.Item>
          )}
          locale={{ emptyText: <Empty description="Không tìm thấy kết quả" /> }}
        />
      ) : (
        <Empty description="Nhập từ khoá để tìm kiếm" />
      )}
    </Card>
  );
}
