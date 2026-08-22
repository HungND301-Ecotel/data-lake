import React, { useEffect, useRef } from "react";
import { createUniver, LocaleType, mergeLocales } from "@univerjs/presets";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import UniverPresetSheetsCoreEnUS from "@univerjs/preset-sheets-core/locales/en-US";
import "@univerjs/preset-sheets-core/lib/index.css";

interface UniverPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any; // IWorkbookData format
  title?: string;
  readOnly?: boolean;
}

export const UniverPreviewModal: React.FC<UniverPreviewModalProps> = ({
  isOpen,
  onClose,
  data,
  title = "Xem trước báo cáo",
  readOnly = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const univerRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    let activeUniver: any = null;

    // Small delay to ensure DOM is fully ready and ref is attached
    const timer = setTimeout(() => {
      try {
        const { univerAPI } = createUniver({
          locale: LocaleType.EN_US,
          locales: {
            [LocaleType.EN_US]: mergeLocales(UniverPresetSheetsCoreEnUS),
          },
          presets: [
            UniverSheetsCorePreset({
              container: containerRef.current!,
            }),
          ],
        });

        activeUniver = univerAPI;
        univerRef.current = univerAPI;

        univerAPI.createWorkbook(data);
      } catch (error) {
        console.error("Lỗi khi khởi tạo Univer Sheets:", error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (activeUniver) {
        activeUniver.dispose();
      }
    };
  }, [isOpen, data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 w-[95vw] h-[90vh] animate-slideUp">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="font-semibold text-sm text-slate-900">{title}</div>
              {readOnly ? (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  Chỉ đọc
                </span>
              ) : (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                  Chế độ chỉnh sửa
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Xem trước bảng dữ liệu báo cáo
            </div>
          </div>
          <div className="flex items-center">
            {!readOnly && (
              <button
                onClick={() => {
                  alert("Lưu dữ liệu báo cáo thành công!");
                  onClose();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-1.5 px-4 rounded-lg border-0 cursor-pointer transition-all mr-3 shadow-sm"
              >
                Lưu lại
              </button>
            )}
            <button
              className="bg-transparent border-0 text-slate-400 text-lg cursor-pointer transition-all hover:text-slate-950 font-bold"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body Container */}
        <div className="flex-1 relative overflow-hidden bg-slate-100 p-2">
          <div
            ref={containerRef}
            className={`w-full h-full rounded-lg border border-slate-200 bg-white ${
              readOnly ? "pointer-events-none select-none opacity-95" : ""
            }`}
          />
        </div>
      </div>
    </div>
  );
};
