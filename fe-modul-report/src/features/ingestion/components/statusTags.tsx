import { Tag, Tooltip } from "antd";
import type { JobStatus, ObjectStatus, SecurityLabel } from "../types/ingestion";

/** Object lifecycle colours follow doc 4.1.2 semantics, not aesthetics. */
const OBJECT_STATUS: Record<ObjectStatus, { color: string; label: string; hint: string }> = {
  UPLOADING: { color: "default", label: "Đang tải", hint: "Phiên upload còn mở, pipeline chưa được đọc" },
  UPLOADED: { color: "blue", label: "Đã tải", hint: "Đủ part và checksum hợp lệ, chờ quét" },
  QUARANTINED: { color: "orange", label: "Cách ly", hint: "Chưa quét xong hoặc có rủi ro, không cho tải xuống" },
  ACCEPTED: { color: "green", label: "Đã tiếp nhận", hint: "Quét sạch, metadata hợp lệ, đã tạo job xử lý" },
  PROCESSING: { color: "processing", label: "Đang xử lý", hint: "Worker đang trích xuất, version đầu vào bị khoá" },
  PROCESSED: { color: "cyan", label: "Đã xử lý", hint: "Đã sinh artifact Silver, chờ kiểm tra/phê duyệt" },
  REJECTED: { color: "red", label: "Từ chối", hint: "Sai loại, nhiễm mã độc hoặc vi phạm policy" },
  ARCHIVED: { color: "purple", label: "Lưu trữ", hint: "Hết vòng đời khai thác, giữ theo retention" },
};

const JOB_STATUS: Record<JobStatus, { color: string; label: string }> = {
  PENDING: { color: "default", label: "Chờ" },
  RUNNING: { color: "processing", label: "Đang chạy" },
  SUCCEEDED: { color: "green", label: "Thành công" },
  FAILED: { color: "orange", label: "Lỗi, sẽ thử lại" },
  CANCELLED: { color: "default", label: "Đã huỷ" },
  DEAD: { color: "red", label: "Vào DLQ" },
};

export function ObjectStatusTag({ status }: { status: ObjectStatus }) {
  const meta = OBJECT_STATUS[status] ?? { color: "default", label: status, hint: "" };
  return (
    <Tooltip title={meta.hint}>
      <Tag color={meta.color}>{meta.label}</Tag>
    </Tooltip>
  );
}

export function JobStatusTag({ status }: { status: JobStatus }) {
  const meta = JOB_STATUS[status] ?? { color: "default", label: status };
  return <Tag color={meta.color}>{meta.label}</Tag>;
}

/** Domain C never leaves the internal enclave, so it is flagged distinctly. */
export function SecurityLabelTag({ label }: { label?: SecurityLabel }) {
  if (!label) return <Tag>—</Tag>;
  const color = label.domain === "C" ? "red" : label.domain === "B" ? "gold" : "blue";
  return (
    <Tooltip title={`Miền ${label.domain} · mức ${label.level}${label.allow_external_ai ? "" : " · không gửi ra AI ngoài"}`}>
      <Tag color={color}>{label.name}</Tag>
    </Tooltip>
  );
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** exponent).toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function formatTime(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
}
