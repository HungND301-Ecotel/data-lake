import { useState } from "react";
import { Card, Button, message } from "antd";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { useServers } from "../hooks/useServers";
import ServerTable from "../components/ServerTable";
import ServerFormModal from "../components/ServerFormModal";
import type { SyncConnectionConfig, SyncConnectionConfigRequest } from "../types/server";

export default function ServerManagementPage() {
  const {
    servers,
    loading,
    refresh,
    createServer,
    updateServer,
    deleteServer,
  } = useServers();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<SyncConnectionConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAdd = () => {
    setEditingServer(null);
    setModalOpen(true);
  };

  const handleEdit = (server: SyncConnectionConfig) => {
    setEditingServer(server);
    setModalOpen(true);
  };

  const handleSave = async (data: SyncConnectionConfigRequest) => {
    setSaving(true);
    const result = editingServer
      ? await updateServer(editingServer.id, data)
      : await createServer(data);

    if (result.success) {
      message.success(editingServer ? "Cập nhật kết nối thành công" : "Thêm kết nối thành công");
      setModalOpen(false);
    } else {
      message.error(result.error);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteServer(id);
    if (result.success) {
      message.success("Đã xoá kết nối");
    } else {
      message.error(result.error);
    }
  };

  return (
    <div className="p-6">
      <Card
        title="Quản lý kết nối Database ngoài"
        extra={
          <div className="flex gap-2">
            <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>
              Làm mới
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Thêm kết nối
            </Button>
          </div>
        }
      >
        <ServerTable
          servers={servers}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
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
