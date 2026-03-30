import { Select, Tag, Typography } from "antd";
import { CloudServerOutlined } from "@ant-design/icons";
import type { ServerConfig } from "../types/dbLakehouse";

const { Text } = Typography;

interface ServerSelectorProps {
  servers: ServerConfig[];
  value: string;
  onChange: (serverId: string) => void;
  loading?: boolean;
}

export default function ServerSelector({ servers, value, onChange, loading }: ServerSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <CloudServerOutlined />
      <Text>Server:</Text>
      <Select
        value={value}
        onChange={onChange}
        loading={loading}
        placeholder="Chọn SQL Server"
        style={{ minWidth: 220 }}
      >
        {servers.map((s) => (
          <Select.Option key={s.id} value={s.id}>
            {s.name} ({s.host})
            {s.is_default && <Tag color="green" className="ml-1">Default</Tag>}
          </Select.Option>
        ))}
      </Select>
    </div>
  );
}
