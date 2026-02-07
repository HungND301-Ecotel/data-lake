import { Select } from "antd";
import { DatabaseOutlined } from "@ant-design/icons";

interface Props {
  databases: string[];
  selectedDb: string | null;
  loading: boolean;
  onSelect: (db: string) => void;
}

export default function DatabaseSelector({ databases, selectedDb, loading, onSelect }: Props) {
  return (
    <Select
      placeholder="Chọn database"
      value={selectedDb}
      onChange={onSelect}
      loading={loading}
      showSearch
      suffixIcon={<DatabaseOutlined />}
      className="w-full"
      options={databases.map((db) => ({ value: db, label: db }))}
    />
  );
}
