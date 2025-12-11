import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import LuckyExcel from "luckyexcel";
import { fileApi } from "../../services/fileApi";

declare global {
  interface Window {
    luckysheet: any;
  }
}

const LuckysheetViewer: React.FC = () => {
  const { fileKey } = useParams<{ fileKey: string }>();
  const decodedFileKey = decodeURIComponent(fileKey || "");
  const [loading, setLoading] = useState(false);
  const [workbookLoaded, setWorkbookLoaded] = useState(false);

  // ================== HANDLE DOWNLOAD ==================
  const handleDownload = () => {
    if (!window.luckysheet) {
      console.error("Luckysheet chưa khởi tạo xong");
      return;
    }
  
    const luckyWorkbook = window.luckysheet.getLuckysheetfile();
    if (!luckyWorkbook) {
      console.error("Không lấy được workbook từ Luckysheet");
      return;
    }
  
    const sheetsForExport = luckyWorkbook.sheets.map((sheet: any) => {
      const maxRow = sheet.row || sheet.data?.length || 50;
      const maxCol = sheet.column || (sheet.data?.[0]?.length ?? 50);
  
      // Convert celldata → matrix
      const matrix: any[][] = Array.from({ length: maxRow }, () =>
        Array.from({ length: maxCol }, () => null)
      );
  
      if (sheet.celldata) {
        sheet.celldata.forEach((cell: any) => {
          if (!matrix[cell.r]) matrix[cell.r] = [];
          matrix[cell.r][cell.c] = { v: cell.v };
        });
      } else if (sheet.data) {
        return {
          name: sheet.name,
          data: sheet.data,
          config: sheet.config || {},
        };
      }
  
      return {
        name: sheet.name,
        data: matrix,
        config: sheet.config || {},
      };
    });
  
    const exportWorkbook = {
      info: { name: luckyWorkbook.info?.name || "workbook" },
      sheets: sheetsForExport,
    };
  
    LuckyExcel.transformLuckyToExcel(exportWorkbook, (blob: Blob | null) => {
      if (!blob) {
        console.error("Export thất bại: LuckyExcel không tạo được blob");
        return;
      }
  
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportWorkbook.info.name + ".xlsx";
      a.click();
      URL.revokeObjectURL(url);
    });
  };
  

  // ================== LOAD FILE ==================
  useEffect(() => {
    if (!decodedFileKey) return;

    const fetchAndLoad = async () => {
      try {
        setLoading(true);

        const blob = await fileApi.getFileV3(decodedFileKey);

        // Ép type chuẩn .xlsx
        const file = new File([blob], "source.xlsx", {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        LuckyExcel.transformExcelToLucky(file, (exportJson: any) => {
          console.log("exportJson:", exportJson);

          if (!exportJson.sheets || exportJson.sheets.length === 0) {
            console.error("File Excel rỗng hoặc không đọc được");
            return;
          }

          // Nếu bảng cũ tồn tại, destroy trước
          window.luckysheet?.destroy?.();

          // Tạo bảng mới
          window.luckysheet.create({
            container: "luckysheet",
            data: exportJson.sheets,
            title: exportJson.info?.name || "workbook",
            showtoolbar: true,
            showinfobar: false,
            showsheetbar: true,
          });

          setWorkbookLoaded(true);
        });
      } catch (error) {
        console.error("Lỗi khi load LuckySheet:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndLoad();
  }, [decodedFileKey]);

  return (
    <div style={{ height: "100vh", width: "100%", position: "relative" }}>
      {/* Toolbar + Download */}
      <div
        style={{
          padding: 10,
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "flex-end",
          background: "#f9f9f9",
        }}
      >
        <button onClick={handleDownload} disabled={!workbookLoaded}>
          Download Excel
        </button>
      </div>

      {/* Container Luckysheet */}
      <div
        id="luckysheet"
        style={{
          width: "100%",
          height: "calc(100% - 50px)",
        }}
      />

      {/* Loading overlay */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>Đang tải file...</span>
        </div>
      )}
    </div>
  );
};

export default LuckysheetViewer;
