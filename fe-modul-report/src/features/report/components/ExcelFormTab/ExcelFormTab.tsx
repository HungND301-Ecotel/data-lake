

import React, { useEffect, useRef, useState } from "react";
import { Spin, message, Alert } from "antd";
import { createUniver, LocaleType, mergeLocales } from "@univerjs/presets";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import UniverPresetSheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US";
import "@univerjs/preset-sheets-core/lib/index.css";

import { fileApi } from "../../api/fileApi";
import { reportStorageApi } from "../../api/reportStorageApi";
import {
  parseExcelBlob,
  extractRowsFromSnapshot,
  extractWebBatchSubmitPayload,
  parseKeyMappingsFromWareMappings,
  type KeyMapping,
  type WebBatchSubmitPayload,
} from "../../utils/excelToUniver";
import { wareBatchApi } from "../../../ware/api/wareBathApi";
import { wareMappingApi } from "../../../ware/api/wareMappingApi";
import { wareTemplateApi } from "../../../ware/api/wareTemplateApi";
import type { WareTemplateResponse } from "../../../ware/types/wareTemplate";

// ─── Props ────────────────────────────────────────────────────────────────────
  @ts-nocheck
export interface ExcelFormTabProps {
  /** fileKey of the template Excel stored in MinIO/S3 */
  fileKey?: string;
  /** Custom function to fetch template Blob (e.g. wareTemplateApi.exportTemplateExcel) */
  fetchBlob?: () => Promise<Blob>;
  reportCategoryId?: string;
  reportTemplateId?: string | number;
  /** Custom handler when submitting extracted JSON rows */
  onSubmitRows?: (rows: Record<string, any>[], payload?: WebBatchSubmitPayload) => Promise<void>;
  /** Called after a successful submit so parent can close/refresh */
  onSuccess: () => void;
  /** Custom submit button label */
  submitText?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ExcelFormTab: React.FC<ExcelFormTabProps> = ({
  fileKey,
  fetchBlob,
  reportCategoryId,
  reportTemplateId,
  onSubmitRows,
  onSuccess,
  submitText = "Gửi dữ liệu",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const univerRef = useRef<any>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyMappings, setKeyMappings] = useState<KeyMapping[]>([]);
  const [templateMappings, setTemplateMappings] = useState<any[]>([]);
  const [templateInfo, setTemplateInfo] = useState<WareTemplateResponse | null>(null);
  const [dataStartRow, setDataStartRow] = useState(0);

  const [messageApi, contextHolder] = message.useMessage();

  // ── Init: fetch template → parse → mount UniversJS ────────────────────────
  useEffect(() => {
    if (!fileKey && !fetchBlob) return;

    let activeUniver: any = null;
    let disposed = false;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch template info (startRow) and DB mappings for this template
        let tInfo: WareTemplateResponse | null = null;
        let dbMappings: any[] = [];
        if (reportTemplateId) {
          try {
            const [infoRes, mappingRes] = await Promise.all([
              wareTemplateApi.getWareTemplateById(Number(reportTemplateId)),
              wareMappingApi.searchWareMapping({
                wareTemplateId: Number(reportTemplateId),
              }),
            ]);
            tInfo = infoRes;
            dbMappings = mappingRes ?? [];
            setTemplateInfo(tInfo);
            setTemplateMappings(dbMappings);
          } catch (e) {
            console.warn("[ExcelFormTab] Failed to fetch template info or mappings:", e);
          }
        }

        // 1. Fetch Excel blob
        let blob: Blob;
        if (fetchBlob) {
          blob = await fetchBlob();
        } else if (fileKey) {
          blob = await fileApi.getFile(fileKey);
        } else {
          throw new Error("Không có thông tin file template.");
        }

        // 2. Parse: detect key row + convert to UniversJS workbook format
        const { workbookData, keyMappings: km, dataStartRowIndex } =
          await parseExcelBlob(blob);

        if (dbMappings && dbMappings.length > 0) {
          const derivedKeys = parseKeyMappingsFromWareMappings(dbMappings);
          if (derivedKeys.length > 0) {
            setKeyMappings(derivedKeys);
          } else {
            setKeyMappings(km);
          }
        } else {
          setKeyMappings(km);
        }

        let initialStartRow = dataStartRowIndex;
        if (tInfo?.startRow !== undefined && tInfo?.startRow !== null && tInfo.startRow > 0) {
          initialStartRow = tInfo.startRow - 1;
        }
        setDataStartRow(initialStartRow);

        if (disposed || !containerRef.current) return;

        // 3. Create UniversJS instance (preset mode — univerAPI returned by createUniver)
        const { univerAPI } = createUniver({
          locale: LocaleType.EN_US,
          locales: {
            [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
          },
          presets: [
            UniverSheetsCorePreset({
              container: containerRef.current,
            }),
          ],
        });

        activeUniver = univerAPI;
        univerRef.current = univerAPI;

        // 4. Load the converted workbook (contains cells, merges, formulas)
        univerAPI.createWorkbook(workbookData);
      } catch (err: any) {
        console.error("[ExcelFormTab] init error:", err);
        if (!disposed) {
          const msg =
            typeof err === "string"
              ? err
              : typeof err?.message === "string"
              ? err.message
              : "Không thể tải file template. Vui lòng thử lại.";
          setError(msg);
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    // Small delay so the container DOM is fully mounted
    const timer = setTimeout(init, 120);

    return () => {
      disposed = true;
      clearTimeout(timer);
      if (activeUniver) {
        activeUniver.dispose();
        univerRef.current = null;
      }
    };
    // Re-init when fileKey or fetchBlob changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileKey, reportTemplateId]);

  // ── Submit: extract JSON rows → POST BE ───────────────────────────────────
  const handleSubmit = async () => {
    if (!univerRef.current) return;

    try {
      setSubmitting(true);

      // Force blur on currently active cell editor DOM element so UniversJS commits active typing into cell model
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Small delay for UniversJS event loop to commit active cell edit into workbook model
      await new Promise((resolve) => setTimeout(resolve, 60));

      const univerAPI = univerRef.current;
      const workbook = univerAPI.getActiveWorkbook();
      const snapshot = workbook.save(); // returns IWorkbookData

      // Extract simple rows and full WebBatchSubmitPayload using templateMappings & templateInfo
      const rows = extractRowsFromSnapshot(snapshot, keyMappings, dataStartRow);
      const payload = extractWebBatchSubmitPayload(
        snapshot,
        keyMappings,
        dataStartRow,
        Number(reportTemplateId || 0),
        templateInfo?.name,
        templateMappings,
        templateInfo ?? undefined
      );

      if (rows.length === 0 && payload.rows.length === 0) {
        messageApi.warning(
          "Chưa có dữ liệu để gửi. Vui lòng điền vào các ô dữ liệu."
        );
        return;
      }

      if (onSubmitRows) {
        await onSubmitRows(rows, payload);
      } else if (reportTemplateId) {
        await wareBatchApi.saveWebSubmitPayload(payload);
      } else if (reportCategoryId && reportTemplateId) {
        await reportStorageApi.saveDataRows(
          reportCategoryId,
          String(reportTemplateId),
          rows
        );
      } else {
        throw new Error("Chưa cấu hình handler lưu dữ liệu.");
      }

      const count = payload.rows.length || rows.length;
      messageApi.success(`Đã gửi ${count} dòng dữ liệu thành công!`);
      onSuccess();
    } catch (err: any) {
      console.error("[ExcelFormTab] submit error:", err);
      const errMsg =
        typeof err === "string"
          ? err
          : typeof err?.message === "string"
          ? err.message
          : typeof err?.data?.message === "string"
          ? err.data.message
          : typeof err?.data === "string"
          ? err.data
          : "Gửi dữ liệu thất bại. Vui lòng thử lại.";
      messageApi.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (error) {
    return (
      <Alert
        type="error"
        message="Lỗi tải template"
        description={error}
        showIcon
        style={{ margin: "16px 0" }}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {contextHolder}

      {/* ── Action bar ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "4px 0",
        }}
      >
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {loading
            ? "Đang phân tích cấu trúc & style template..."
            : keyMappings.length > 0
            ? `✓ Đã tải mẫu Excel (${keyMappings.length} cột) — điền dữ liệu từ dòng ${dataStartRow + 1} trở xuống`
            : "✓ Đã tải mẫu Excel — hãy điền dữ liệu vào bảng bên dưới"}
        </span>

        <button
          onClick={handleSubmit}
          disabled={submitting || loading || !!error}
          style={{
            backgroundColor:
              submitting || loading || !!error ? "#9ca3af" : "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "7px 20px",
            fontWeight: 600,
            fontSize: 13,
            cursor:
              submitting || loading || !!error ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {submitting ? "Đang gửi..." : submitText}
        </button>
      </div>

      {/* ── UniversJS Spreadsheet ── */}
      <Spin spinning={loading} tip="Đang tải template Excel..." style={{ height: "100%" }}>
        <div
          ref={containerRef}
          style={{
            width: "100%",
            height: "calc(85vh - 90px)",
            minHeight: "620px",
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            overflow: "hidden",
            visibility: loading ? "hidden" : "visible",
          }}
        />
      </Spin>
    </div>
  );
};

export default ExcelFormTab;
