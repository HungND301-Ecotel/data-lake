import { useState } from "react";
import { Card, Button, message } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useServers } from "../hooks/useServers";
import ServerTable from "../components/ServerTable";
import ServerFormModal from "../components/ServerFormModal";
import type { ServerConfig, ServerCreateRequest, ServerUpdateRequest } from "../types/server";

export default function ServerManagementPage() {
  const {
    servers, loading, refresh,
    createServer, updateServer, deleteServer,
    testConnection, setDefault,
  } = useServers();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAdd = () => {
    setEditingServer(null);
    setModalOpen(true);
  };

  const handleEdit = (server: ServerConfig) => {
    setEditingServer(server);
    setModalOpen(true);
  };

  const handleSave = async (data: ServerCreateRequest | ServerUpdateRequest) => {
    setSaving(true);
    const result = editingServer
      ? await updateServer(editingServer.id, data as ServerUpdateRequest)
      : await createServer(data as ServerCreateRequest);

    if (result.success) {
      message.success(editingServer ? "Cập nhật thành công" : "Thêm server thành công");
      setModalOpen(false);
    } else {
      message.error(result.error);
    }
    setSaving(false);
  };

  const handleDelete = async (serverId: string) => {
    const result = await deleteServer(serverId);
    if (result.success) {
      message.success("Đã xoá server");
    } else {
      message.error(result.error);
    }
  };

  const handleSetDefault = async (serverId: string) => {
    const result = await setDefault(serverId);
    if (result.success) {
      message.success("Đã đặt server mặc định");
    } else {
      message.error(result.error);
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="Quản lý SQL Server"
        extra={
          <div className="flex gap-2">
            <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
              Làm mới
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm Server
            </Button>
          </div>
        }
      >
        <ServerTable
          servers={servers}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSetDefault={handleSetDefault}
          onTest={testConnection}
        />
      </Card>

      <ServerFormModal
        open={modalOpen}
        server={editingServer}
        loading={saving}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
