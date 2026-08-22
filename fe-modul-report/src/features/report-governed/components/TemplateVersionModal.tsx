import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Empty,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import governedReportApi, {
  type ReportDataQuery,
  type ReportDefinition,
  type ReportPlaceholder,
  type ReportTemplateVersion,
  type Validation,
} from "../api/governedReportApi";

const PLACEHOLDER_TYPE: Record<string, { color: string; label: string }> = {
  FIELD: { color: "blue", label: "Số liệu" },
  TABLE: { color: "purple", label: "Bảng" },
  CHART: { color: "geekblue", label: "Biểu đồ" },
  AI_SECTION: { color: "gold", label: "Nhận xét AI" },
};

const FORMATS = ["TEXT", "NUMBER", "NUMBER_0", "PERCENT", "DATE"];

interface Props {
  definition: ReportDefinition | null;
  queries: ReportDataQuery[];
  onClose: () => void;
  onChanged: () => void;
}

/**
 * Quản lý phiên bản mẫu và ánh xạ placeholder - UC10.01 đến UC10.04.
 *
 * <p>Placeholder do máy quét từ tệp mẫu, nên danh sách ở đây là đầy đủ theo
 * đúng nghĩa: không map hết thì không duyệt được mẫu.
 */
export default function TemplateVersionModal({
  definition,
  queries,
  onClose,
  onChanged,
}: Props) {
  const [versions, setVersions] = useState<ReportTemplateVersion[]>([]);
  const [current, setCurrent] = useState<ReportTemplateVersion | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!definition) return;
    setLoading(true);
    try {
      const list = await governedReportApi.listVersions(definition.code);
      setVersions(list.items);
      if (list.items.length) {
        const detail = await governedReportApi.getVersion(list.items[0].id);
        setCurrent(detail);
        setValidation(await governedReportApi.validateVersion(detail.id));
      } else {
        setCurrent(null);
        setValidation(null);
      }
    } finally {
      setLoading(false);
    }
  }, [definition]);

  useEffect(() => {
    setCurrent(null);
    setValidation(null);
    load();
  }, [load]);

  const refreshCurrent = async () => {
    if (!current) return;
    const detail = await governedReportApi.getVersion(current.id);
    setCurrent(detail);
    setValidation(await governedReportApi.validateVersion(detail.id));
  };

  const editable = current?.status === "DRAFT";

  return (
    <Modal
      title={`Mẫu báo cáo · ${definition?.name ?? ""}`}
      open={Boolean(definition)}
      onCancel={onClose}
      width={1000}
      footer={
        <Space>
          <Button onClick={onClose}>Đóng</Button>
          {current && current.status === "DRAFT" && (
            <Button
              type="primary"
              disabled={!validation?.valid}
              onClick={async () => {
                await governedReportApi.approveVersion(current.id);
                message.success("Đã phê duyệt phiên bản mẫu");
                await load();
                onChanged();
              }}
            >
              Phê duyệt mẫu
            </Button>
          )}
        </Space>
      }
    >
      <Space direction="vertical" className="w-full" size="middle">
        <Space wrap>
          <Upload
            maxCount={1}
            showUploadList={false}
            beforeUpload={async (file) => {
              if (!definition) return false;
              await governedReportApi.uploadVersion(definition.code, file as File);
              message.success("Đã tải lên và quét placeholder");
              await load();
              onChanged();
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>Tải lên phiên bản mẫu (DOCX/XLSX)</Button>
          </Upload>

          {versions.length > 1 && (
            <Select
              value={current?.id}
              style={{ width: 260 }}
              onChange={async (id) => {
                const detail = await governedReportApi.getVersion(id);
                setCurrent(detail);
                setValidation(await governedReportApi.validateVersion(id));
              }}
              options={versions.map((v) => ({
                value: v.id,
                label: `v${v.versionNo} · ${v.status}`,
              }))}
            />
          )}

          {current && (
            <Tag color={current.status === "APPROVED" ? "green" : "orange"}>
              v{current.versionNo} · {current.status}
            </Tag>
          )}
        </Space>

        {validation && !validation.valid && (
          <Alert
            type="warning"
            showIcon
            message="Mẫu chưa sẵn sàng"
            description={
              <ul className="m-0 pl-4">
                {validation.unmappedPlaceholders.map((token) => (
                  <li key={token}>Chưa map: {token}</li>
                ))}
                {validation.problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            }
          />
        )}

        {validation?.valid && current?.status === "DRAFT" && (
          <Alert type="success" showIcon message="Đã map đủ placeholder, có thể phê duyệt mẫu." />
        )}

        {!current ? (
          <Empty description="Chưa có phiên bản mẫu nào" />
        ) : (
          <Table
            rowKey="id"
            size="small"
            loading={loading}
            pagination={false}
            dataSource={current.placeholders}
            columns={[
              {
                title: "Placeholder",
                dataIndex: "token",
                width: 230,
                render: (value: string, row: ReportPlaceholder) => (
                  <Space direction="vertical" size={0}>
                    <code className="text-xs">{value}</code>
                    <span className="text-xs text-gray-400">{row.locator}</span>
                  </Space>
                ),
              },
              {
                title: "Loại",
                dataIndex: "type",
                width: 120,
                render: (value: string) => (
                  <Tag color={PLACEHOLDER_TYPE[value]?.color}>
                    {PLACEHOLDER_TYPE[value]?.label ?? value}
                  </Tag>
                ),
              },
              {
                title: "Ánh xạ",
                key: "mapping",
                render: (_, row) => (
                  <MappingEditor
                    placeholder={row}
                    queries={queries}
                    editable={Boolean(editable)}
                    onSaved={refreshCurrent}
                  />
                ),
              },
            ]}
          />
        )}
      </Space>
    </Modal>
  );
}

function MappingEditor({
  placeholder,
  queries,
  editable,
  onSaved,
}: {
  placeholder: ReportPlaceholder;
  queries: ReportDataQuery[];
  editable: boolean;
  onSaved: () => void;
}) {
  const isAi = placeholder.type === "AI_SECTION";
  const [queryCode, setQueryCode] = useState(placeholder.mapping?.dataQueryCode ?? undefined);
  const [column, setColumn] = useState(placeholder.mapping?.outputColumn ?? "");
  const [format, setFormat] = useState(placeholder.mapping?.format ?? "TEXT");
  const [unit, setUnit] = useState(placeholder.mapping?.unit ?? "");
  const [instruction, setInstruction] = useState(placeholder.mapping?.aiInstruction ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await governedReportApi.upsertMapping({
        placeholderId: placeholder.id,
        dataQueryCode: isAi ? undefined : queryCode,
        outputColumn: isAi ? undefined : column || undefined,
        format: isAi ? undefined : format,
        unit: isAi ? undefined : unit || undefined,
        aiInstruction: isAi ? instruction : undefined,
      });
      message.success("Đã lưu ánh xạ");
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  if (!editable) {
    return (
      <span className="text-xs">
        {isAi
          ? placeholder.mapping?.aiInstruction ?? "chưa có lời dẫn"
          : placeholder.mapping
          ? `${placeholder.mapping.dataQueryCode} v${placeholder.mapping.dataQueryVersion} · ${
              placeholder.mapping.outputColumn ?? "cả bảng"
            }`
          : "chưa map"}
      </span>
    );
  }

  if (isAi) {
    return (
      <Space.Compact className="w-full">
        <Input
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Lời dẫn cho mô hình, ví dụ: nhận xét ngắn về sản lượng kỳ này"
        />
        <Button type="primary" loading={saving} onClick={save}>
          Lưu
        </Button>
      </Space.Compact>
    );
  }

  return (
    <Space wrap>
      <Select
        value={queryCode}
        onChange={setQueryCode}
        style={{ width: 200 }}
        placeholder="Truy vấn đã duyệt"
        options={queries.map((q) => ({ value: q.code, label: `${q.code} v${q.versionNo}` }))}
      />
      {placeholder.type === "FIELD" && (
        <>
          <Input
            value={column}
            onChange={(e) => setColumn(e.target.value)}
            placeholder="cột"
            style={{ width: 140 }}
          />
          <Select
            value={format}
            onChange={setFormat}
            style={{ width: 120 }}
            options={FORMATS.map((f) => ({ value: f, label: f }))}
          />
          <Input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder="đơn vị"
            style={{ width: 100 }}
          />
        </>
      )}
      <Button type="primary" loading={saving} onClick={save}>
        Lưu
      </Button>
    </Space>
  );
}
