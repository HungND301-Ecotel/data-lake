import { useState } from "react";
import { FileSpreadsheet, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";

interface BatchSyncModalProps {
  onClose: () => void;
  selectedBatches?: any[];
}

export function BatchSyncModal({
  onClose,
  selectedBatches = [],
}: BatchSyncModalProps) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 w-full max-w-[480px] animate-slideUp">
        {/* Header */}
        <div className="p-5 px-7 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex flex-col">
            <div className="font-semibold text-sm text-slate-900">
              Đồng bộ Batch TKV
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Xử lý đẩy gói dữ liệu lên hệ thống Tập đoàn
            </div>
          </div>
          <button
            className="bg-transparent border-0 text-slate-400 text-lg cursor-pointer transition-all hover:text-slate-950"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-7 overflow-y-auto">
          {!syncing && !synced && (
            <div className="flex flex-col gap-4">
              {selectedBatches.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-2">
                    Gói dữ liệu đồng bộ:
                  </div>
                  <div className="flex flex-col gap-2">
                    {selectedBatches.map((batch, i) => (
                      <div
                        key={i}
                        className="p-2.5 px-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-xs flex items-center gap-2 text-teal-800 font-semibold"
                      >
                        <FileSpreadsheet size={16} />
                        {batch.name || batch}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-slate-50 rounded-xl p-4 px-5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
                  <AlertCircle size={16} className="text-teal-700" />
                  Quy trình đồng bộ dữ liệu
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed">
                  <p>
                    Hệ thống tự động biên dịch cấu trúc Excel, kiểm tra định
                    dạng và đồng bộ trực tiếp lên hệ thống dữ liệu tập trung
                    TKV. Thời gian xử lý có thể kéo dài vài giây.
                  </p>
                </div>
              </div>
            </div>
          )}

          {syncing && (
            <div className="p-6 text-center flex flex-col items-center gap-3">
              <RefreshCw size={32} className="text-teal-700 animate-spin" />
              <div className="text-xs font-semibold text-slate-800">
                Đang thực hiện đồng bộ...
              </div>
              <div className="text-[10px] text-slate-500">
                Vui lòng giữ kết nối mạng ổn định.
              </div>
            </div>
          )}

          {synced && (
            <div className="p-6 text-center flex flex-col items-center gap-3">
              <CheckCircle2 size={40} className="text-emerald-500" />
              <div className="text-sm font-bold text-teal-900">
                Đồng bộ thành công!
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Dữ liệu đã được cập nhật thành công lên Báo cáo Tập đoàn TKV.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 px-7 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          {!syncing && !synced && (
            <>
              <button
                className="bg-white text-slate-700 border border-slate-200 rounded-lg py-2 px-4 font-semibold text-xs cursor-pointer"
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                className="bg-teal-700 text-white border-0 rounded-lg py-2 px-4 font-semibold text-xs cursor-pointer hover:bg-teal-800"
                onClick={handleSync}
              >
                Bắt đầu đồng bộ
              </button>
            </>
          )}
          {synced && (
            <button
              className="bg-teal-700 text-white border-0 rounded-lg py-2 px-4 font-semibold text-xs cursor-pointer hover:bg-teal-800"
              onClick={onClose}
            >
              Đóng cửa sổ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
