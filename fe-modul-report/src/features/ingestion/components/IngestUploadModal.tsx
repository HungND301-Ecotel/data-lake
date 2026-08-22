import { useState } from "react";
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Progress,
  Select,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { useIngestionRefData } from "../hooks/useIngestionRefData";
import { useMultipartUpload } from "../hooks/useMultipartUpload";
import type { BronzeObject, DuplicatePolicy } from "../types/ingestion";
import { formatBytes } from "./statusTags";

const { Dragger } = Upload;
const { Text } = Typography;

const PHASE_LABEL: Record<string, string> = {
  hashing: "Đang tính checksum SHA-256",
  uploading: "Đang tải các part",
  completing: "Đang xác minh và quét mã độc",
  done: "Hoàn tất",
  error: "Lỗi",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded: (object: BronzeObject) => void;
}

export default function IngestUploadModal({ open, onClose, onUploaded }: Props) {
  const [form] = Form.useForm();
  const { labels, retentions, organizations, sources, loading } = useIngestionRefData();
  const { state, upload, abort, reset } = useMultipartUpload();
  const [file, setFile] = useState<File | null>(null);

  const busy = ["hashing", "uploading", "completing"].includes(state.phase);

  const handleSubmit = async () => {
    if (!file) {
      message.warning("Chọn tệp cần tải lên");
      return;
    }
    const values = await form.validateFields();
    const object = await upload(file, {
      source_system_id: values.source_system_id,
      owner_org_id: values.owner_org_id,
      security_label_id: values.security_label_id,
      retention_policy_id: values.retention_policy_id,
      document_type: values.document_type,
      purpose: values.purpose,
      duplicate_policy: values.duplicate_policy as DuplicatePolicy,
    });
    if (object) {
      onUploaded(object);
      handleClose();
    }
  };

  const handleClose = () => {
    if (busy) return;
    setFile(null);
    form.resetFields();
    reset();
    onClose();
  };

  return (
    <Modal
      title="Tiếp nhận dữ liệu vào Bronze"
      open={open}
      onCancel={handleClose}
      width={720}
      maskClosable={!busy}
      footer={[
        busy ? (
          <Button key="abort" danger onClick={abort}>
            Huỷ phiên
          </Button>
        ) : (
          <Button key="close" onClick={handleClose}>
            Đóng
          </Button>
        ),
        <Button key="submit" type="primary" loading={busy} onClick={handleSubmit}>
          Tải lên
        </Button>,
      ]}
    >
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message="Mọi tệp phải khai báo đủ nguồn, đơn vị sở hữu, nhãn bảo mật, chính sách lưu giữ, loại tài liệu và mục đích sử dụng."
        description="Tệp được tính checksum ở trình duyệt, tải theo từng part, quét mã độc rồi mới chuyển sang trạng thái ACCEPTED. OCR chạy nền, không chạy trong request tải lên."
      />

      <Dragger
        multiple={false}
        maxCount={1}
        disabled={busy}
        beforeUpload={(selected) => {
          setFile(selected);
          return false;
        }}
        onRemove={() => setFile(null)}
        fileList={file ? ([{ uid: "1", name: file.name, size: file.size }] as UploadFile[]) : []}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Kéo thả hoặc bấm để chọn tệp</p>
        <p className="ant-upload-hint">
          {file ? `${file.name} · ${formatBytes(file.size)}` : "Hỗ trợ PDF, ảnh, DOCX, XLSX, CSV, TXT"}
        </p>
      </Dragger>

      {busy || state.phase === "error" ? (
        <div className="mt-4">
          <Progress
            percent={state.percent}
            status={state.phase === "error" ? "exception" : "active"}
          />
          <Space direction="vertical" size={0}>
            <Text type="secondary">{PHASE_LABEL[state.phase] ?? ""}</Text>
            {state.totalParts > 1 && (
              <Text type="secondary">
                Part {state.sentParts}/{state.totalParts}
              </Text>
            )}
            {state.error && <Text type="danger">{state.error}</Text>}
          </Space>
        </div>
      ) : null}

      <Form
        form={form}
        layout="vertical"
        className="mt-4"
        disabled={busy}
        initialValues={{ duplicate_policy: "NEW_VERSION" }}
      >
        <div className="grid grid-cols-2 gap-x-4">
          <Form.Item
            name="source_system_id"
            label="Nguồn dữ liệu"
            rules={[{ required: true, message: "Chọn nguồn dữ liệu" }]}
          >
            <Select
              loading={loading}
              placeholder="Chọn nguồn"
              options={sources.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
            />
          </Form.Item>

          <Form.Item
            name="owner_org_id"
            label="Đơn vị sở hữu"
            rules={[{ required: true, message: "Chọn đơn vị sở hữu" }]}
          >
            <Select
              loading={loading}
              placeholder="Chọn đơn vị"
              options={organizations.map((o) => ({ value: o.id, label: `${o.name} (${o.code})` }))}
            />
          </Form.Item>

          <Form.Item
            name="security_label_id"
            label="Nhãn bảo mật"
            rules={[{ required: true, message: "Chọn nhãn bảo mật" }]}
            extra="Chỉ hiển thị các nhãn trong phạm vi clearance của bạn"
          >
            <Select
              loading={loading}
              placeholder="Chọn nhãn"
              options={labels.map((l) => ({
                value: l.id,
                label: `${l.name} · miền ${l.domain}`,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="retention_policy_id"
            label="Chính sách lưu giữ"
            rules={[{ required: true, message: "Chọn chính sách lưu giữ" }]}
          >
            <Select
              loading={loading}
              placeholder="Chọn chính sách"
              options={retentions.map((r) => ({
                value: r.id,
                label: r.retention_days ? `${r.name} (${r.retention_days} ngày)` : r.name,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="document_type"
            label="Loại tài liệu"
            rules={[{ required: true, message: "Nhập loại tài liệu" }]}
          >
            <Input placeholder="VD: BAO_CAO_THANG, HOP_DONG" />
          </Form.Item>

          <Form.Item name="duplicate_policy" label="Xử lý trùng checksum">
            <Select
              options={[
                { value: "NEW_VERSION", label: "Tạo phiên bản mới" },
                { value: "LINK_EXISTING", label: "Liên kết bản đã có" },
                { value: "REJECT", label: "Từ chối" },
              ]}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="purpose"
          label="Mục đích sử dụng"
          rules={[{ required: true, message: "Nhập mục đích sử dụng" }]}
        >
          <Input placeholder="VD: Phục vụ báo cáo quý cho Ban Kế hoạch" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
