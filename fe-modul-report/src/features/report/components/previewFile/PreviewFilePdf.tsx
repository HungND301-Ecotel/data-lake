import React, { useEffect, useState } from "react";
import { Spin, message } from "antd";
import { fileApi } from "../../api/fileApi";
import { useParams } from "react-router-dom";

const PreviewFilePdf: React.FC = () => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { fileKey } = useParams<{ fileKey: string }>();
  const decodedFileKey = decodeURIComponent(fileKey || "");

  useEffect(() => {
    if (!fileKey) return;

    const pdfFileKey = decodedFileKey.endsWith(".pdf")
      ? decodedFileKey
      : `${decodedFileKey}.pdf`;

    let objectUrl: string | null = null;

    const fetchPdf = async () => {
      setLoading(true);
      try {
        const blob = await fileApi.getFile(pdfFileKey);

        const pdfBlob = new Blob([blob], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(pdfBlob);

        setPdfUrl(objectUrl);
      } catch (err) {
        console.error("Failed to load PDF", err);
        messageApi.error("Tải PDF thất bại!");
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setPdfUrl(null);
    };
  }, [fileKey]);

  if (!fileKey) return <div>Không có file</div>;

  return (
    <div className="w-full h-screen relative flex flex-col">
      {contextHolder}
  
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
          <Spin size="large" />
        </div>
      )}
  
      {pdfUrl && (
        <iframe
          src={pdfUrl}
          title="PDF Preview"
          className="flex-1 w-full"
          style={{ border: "none" }}
        />
      )}
    </div>
  );
  
};

export default PreviewFilePdf;
