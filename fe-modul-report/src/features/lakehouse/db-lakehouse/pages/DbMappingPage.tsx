import { useState } from "react";
import { Card, Table, Button, Alert, Modal, Space, Tag, Popconfirm, Typography, Progress, message } from "antd";
import { PlusOutlined, ReloadOutlined, DeleteOutlined, EyeOutlined, SwapOutlined } from "@ant-design/icons";
import { useValueMapping } from "../hooks/useValueMapping";
import { useDbPipeline } from "../hooks/useDbPipeline";
import MappingEditor from "../components/MappingEditor";
import MappingApplyForm from "../components/MappingApplyForm";
import MappingApplyResult from "../components/MappingApplyResult";
import type { ValueMappingListItem, ValueMappingSaveRequest, ValueMappingApplyRequest } from "../types/dbLakehouse";

const { Title } = Typography;

export default function DbMappingPage() {
  const {
    mappings, selectedMapping, applyResult,
    loading, saving, applying, error,
    streamProgress, streamMessage,
    fetchMappings, getMapping, saveMapping, deleteMapping,
    applyMappingStream,
  } = useValueMapping();
  const { databasesByLayer } = useDbPipeline();

  const [editorVisible, setEditorVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);

  const allDatabases = [
    ...databasesByLayer("bronze"),
    ...databasesByLayer("silver"),
    ...databasesByLayer("gold"),
  ];

  const handleSave = async (values: ValueMappingSaveRequest) => {
    const result = await saveMapping(values);
    if (result.success) {
      message.success("Đã lưu bộ mapping!");
      setEditorVisible(false);
    }
  };

  const handleDelete = async (name: string) => {
    const result = await deleteMapping(name);
    if (result.success) {
      message.success("Đã xoá mapping!");
    }
  };

  const handleView = async (name: string) => {
    await getMapping(name);
    setDetailVisible(true);
  };

  const handleApply = async (values: ValueMappingApplyRequest) => {
    await applyMappingStream(values);
  };

  const columns = [
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <span className="font-medium">{name}</span>,
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (v: string | null) => v || <span className="text-gray-400">-</span>,
    },
    {
      title: "Số rules",
      dataIndex: "mapping_count",
      key: "mapping_count",
      width: 100,
      render: (v: number) => <Tag color="green">{v}</Tag>,
    },
    {
      title: "Chế độ",
      dataIndex: "match_mode",
      key: "match_mode",
      width: 100,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "created_at",
      key: "created_at",
      width: 170,
      render: (v: string) => v ? new Date(v).toLocaleString("vi-VN") : "-",
    },
    {
      title: "",
      key: "actions",
      width: 120,
      render: (_: unknown, record: ValueMappingListItem) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record.name)} />
          <Popconfirm title="Xoá mapping này?" onConfirm={() => handleDelete(record.name)}>
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {error && <Alert message={error} type="error" closable />}

      <Card
        title={
          <Title level={5} className="mb-0">
            <SwapOutlined className="mr-2" />
            Value Mapping - Chuẩn hoá dữ liệu
          </Title>
        }
        extra={
          <Space>
            <Button icon={<PlusOutlined />} type="primary" onClick={() => setEditorVisible(true)}>
              Tạo mapping
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchMappings} loading={loading}>
              Làm mới
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={mappings}
          columns={columns}
          rowKey="name"
          loading={loading}
          size="small"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <MappingApplyForm
        savedMappings={mappings}
        databases={allDatabases}
        applying={applying}
        onApply={handleApply}
      />

      {applying && (
        <Card size="small">
          <Progress percent={Math.round(streamProgress)} status="active" />
          {streamMessage && <Tag color="processing" className="mt-2">{streamMessage}</Tag>}
        </Card>
      )}

      {applyResult && <MappingApplyResult result={applyResult} />}

      <Modal
        title="Tạo bộ mapping mới"
        open={editorVisible}
        onCancel={() => setEditorVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <MappingEditor saving={saving} onSave={handleSave} />
      </Modal>

      <Modal
        title={selectedMapping ? `Chi tiết: ${selectedMapping.name}` : "Chi tiết Mapping"}
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={
          <Button onClick={() => { setDetailVisible(false); setEditorVisible(true); }}>
            Chỉnh sửa
          </Button>
        }
        width={700}
      >
        {selectedMapping && (
          <div className="space-y-3">
            <div>
              <Tag>{selectedMapping.match_mode}</Tag>
              <Tag>{selectedMapping.case_insensitive ? "Không phân biệt hoa/thường" : "Phân biệt hoa/thường"}</Tag>
              {selectedMapping.description && <p className="mt-2 text-gray-500">{selectedMapping.description}</p>}
            </div>
            <Table
              dataSource={selectedMapping.mappings}
              columns={[
                {
                  title: "Giá trị gốc",
                  dataIndex: "from_value",
                  key: "from_value",
                  render: (v: string) => <Tag color="red">{v}</Tag>,
                },
                {
                  title: "Giá trị chuẩn hoá",
                  dataIndex: "to_value",
                  key: "to_value",
                  render: (v: string) => <Tag color="green">{v}</Tag>,
                },
              ]}
              rowKey="from_value"
              size="small"
              pagination={false}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
