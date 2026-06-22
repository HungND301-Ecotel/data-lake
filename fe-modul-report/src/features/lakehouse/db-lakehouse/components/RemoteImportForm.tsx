import { useState, useEffect } from "react";
import { Form, Select, Input, Button, Card, Typography, Tag, Space } from "antd";
import { CloudDownloadOutlined, ApiOutlined } from "@ant-design/icons";
import { serverApi } from "../api/serverApi";
import type { ServerConfig, RemoteImportRequest } from "../types/dbLakehouse";

const { Title, Text } = Typography;

interface RemoteImportFormProps {
  servers: ServerConfig[];
  loading: boolean;
  onSubmit: (values: RemoteImportRequest) => void;
}

export default function RemoteImportForm({ servers, loading, onSubmit }: RemoteImportFormProps) {
  const [form] = Form.useForm();
  const [remoteDatabases, setRemoteDatabases] = useState<string[]>([]);
  const [loadingDbs, setLoadingDbs] = useState(false);
  const sourceServerId = Form.useWatch("source_server_id", form);

  useEffect(() => {
    if (!sourceServerId) {
      setRemoteDatabases([]);
      return;
    }
    const fetch = async () => {
      setLoadingDbs(true);
      try {
        const dbs = await serverApi.getDatabases(sourceServerId);
        setRemoteDatabases(dbs || []);
      } catch {
        setRemoteDatabases([]);
      } finally {
        setLoadingDbs(false);
      }
    };
    fetch();
  }, [sourceServerId]);

  const handleFinish = (values: {
    source_server_id: string;
    source_database: string;
    target_server_id?: string;
    bronze_database?: string;
    tables?: string;
  }) => {
    const body: RemoteImportRequest = {
      source_server_id: values.source_server_id,
      source_database: values.source_database,
      target_server_id: values.target_server_id || undefined,
      bronze_database: values.bronze_database || undefined,
      tables: values.tables ? values.tables.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    };
    onSubmit(body);
  };

  const defaultServer = servers.find((s) => s.is_default);

  return (
    <Card>
      <Title level={5}>
        <CloudDownloadOutlined className="mr-2 text-blue-500" />
        Import từ Remote Server
      </Title>
      <Text type="secondary" className="block mb-4">
        Copy dữ liệu từ SQL Server khác về Bronze database trên server đích.
      </Text>

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="source_server_id"
            label="Server nguồn (Remote)"
            rules={[{ required: true, message: "Chọn server nguồn" }]}
          >
            <Select placeholder="Chọn server chứa dữ liệu">
              {servers.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  <Space>
                    <ApiOutlined />
                    {s.name} ({s.host})
                    {s.is_default && <Tag color="green" className="ml-1">Default</Tag>}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="source_database"
            label="Database nguồn"
            rules={[{ required: true, message: "Chọn database nguồn" }]}
          >
            <Select
              placeholder={sourceServerId ? "Chọn database" : "Chọn server nguồn trước"}
              loading={loadingDbs}
              disabled={!sourceServerId}
              showSearch
            >
              {remoteDatabases.map((db) => (
                <Select.Option key={db} value={db}>{db}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item name="target_server_id" label="Server đích (để trống = mặc định)">
            <Select placeholder={defaultServer ? `Mặc định: ${defaultServer.name}` : "Server mặc định"} allowClear>
              {servers.map((s) => (
                <Select.Option key={s.id} value={s.id}>
                  {s.name} ({s.host})
                  {s.is_default && <Tag color="green" className="ml-1">Default</Tag>}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="bronze_database" label="Tên Bronze DB (để trống = tự động)">
            <Input placeholder="Tự động tạo tên" />
          </Form.Item>
        </div>

        <Form.Item name="tables" label="Bảng cần import (phân cách bằng dấu phẩy, để trống = tất cả)">
          <Input placeholder="VD: DM_REPORT_CTHUC, DM_BCTC (để trống = import tất cả bảng)" />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={<CloudDownloadOutlined />}
          size="large"
        >
          Import từ Remote Server
        </Button>
      </Form>
    </Card>
  );
}
