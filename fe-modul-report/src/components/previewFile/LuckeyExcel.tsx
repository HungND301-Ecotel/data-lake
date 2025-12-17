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

  useEffect(() => {
    if (!decodedFileKey) return;

    const fetchAndLoad = async () => {
      try {
        setLoading(true);

        const blob = await fileApi.getFileV3(decodedFileKey);

        const file = new File([blob], "source.xlsx", {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        LuckyExcel.transformExcelToLucky(file, (exportJson: any) => {
          console.log("exportJson:", exportJson);

          if (!exportJson.sheets || exportJson.sheets.length === 0) {
            console.error("File Excel rỗng hoặc không đọc được");
            return;
          }

          window.luckysheet?.destroy?.();

          window.luckysheet.create({
            container: "luckysheet",
            data: exportJson.sheets,
            title: exportJson.info?.name || "workbook",
            showtoolbar: false,
            showinfobar: false,
            showsheetbar: true,
          });
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

      <div
        id="luckysheet"
        style={{
          width: "100%",
          height: "calc(100% - 50px)",
        }}
      />

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
