import React, { useEffect, useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import type { Data, Report, ReportItem, Table, Text } from "../types/report";
import { FaTrash, FaEye, FaFilePdf, FaSave, FaFileExcel } from "react-icons/fa";
import TextComponent from "../components/ViewUser.tsx/Text";
import TableComponent from "../components/ViewUser.tsx/TableComponent";
import DataComponent from "../components/ViewUser.tsx/DataComponent";
import { useLocation, useParams } from "react-router-dom";
import { v4 } from "uuid";
import { message, Modal } from "antd";
import PdfPreviewModal from "../components/previewReport/PdfPreviewModalProps ";
import { excelApi } from "../api/excelApi";
import reportApi from "../api/reportApi";

const ReportDetail: React.FC = () => {
  const location = useLocation();
  const isUserView = location.pathname.includes("/reports/template/us");
  const [fileName, setFileName] = useState("report.pdf");

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const { reportId } = useParams();
  // ----------- PDF modal state -----------
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, contextHolderModal] = Modal.useModal();

  const loadReport = async () => {
    setLoading(true);
    if (!reportId) {
      return <p>Không có báo cáo được chọn</p>;
    }
    const data = await reportApi.getReportById(reportId);
    setReport(data);
    setLoading(false);
  };

  useEffect(() => {
    loadReport();
  }, [reportId]);

  if (loading) return <p>Đang tải báo cáo...</p>;
  if (!report) return <p>Không tìm thấy báo cáo!</p>;

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(report.items);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    const updated = items.map((i, idx) => ({ ...i, index: idx }));
    setReport({ ...report, items: updated });
  };

  const deleteItem = (index: number) => {
    if (!report) return;

    const item = report.items[index];
    if (!item) return;

    modal.confirm({
      title: "Xác nhận xoá nội dung",
      content:
        "Bạn có chắc chắn muốn xoá mục này không? Hành động này không thể hoàn tác.",
      okText: "Xoá",
      okType: "danger",
      cancelText: "Hủy",

      async onOk() {
        try {
          // Nếu là item mới tạo (id bắt đầu bằng new-)
          if (item.id.startsWith("new-")) {
            const newItems = report.items
              .filter((_, idx) => idx !== index)
              .map((it, idx) => ({ ...it, index: idx }));

            setReport({ ...report, items: newItems });
            messageApi.success("Đã xóa mục");
            return;
          }

          // Item cũ → call API
          await reportApi.deleteItemById(item.id);

          const newItems = report.items
            .filter((_, idx) => idx !== index)
            .map((it, idx) => ({ ...it, index: idx }));

          setReport({ ...report, items: newItems });
          messageApi.success("Xóa thành công!");
        } catch (err) {
          console.error("Xóa thất bại:", err);
          messageApi.error("Xóa thất bại, vui lòng thử lại");
          throw err;
        }
      },
    });
  };

  const handleExportPdf = async () => {
    try {
      if (!report) return;
      const pdfBytes = await reportApi.exportPdf(report);

      console.log("fetched json:", JSON.stringify(report, null, 2));
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      setPdfModalOpen(true);
    } catch (error: any) {
      // messageApi.error("Lỗi xuất PDF:"+  error);
      messageApi.error(error?.data || "Lỗi xuất PDF");
    }
  };

  const handleExportExcel = async () => {
    try {
      if (!report) return;

      const excelBytes = await excelApi.exportExcel(report);

      console.log("fetched json:", JSON.stringify(report, null, 2));

      const blob = new Blob([excelBytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = URL.createObjectURL(blob);

      window.open(url);
    } catch (error: any) {
      messageApi.error(error?.data || "Lỗi xuất Excel");
    }
  };

  const handleSave = async () => {
    try {
      console.log("📌 REPORT JSON:", JSON.stringify(report, null, 2));
      const scrollY = window.scrollY;
      const res = await reportApi.addReport(report);
      messageApi.success("Lưu báo cáo thành công!");

      if (reportId) {
        const data = await reportApi.getReportById(reportId);
        setReport(data);
      }

      window.scrollTo({ top: scrollY });

      return res;
    } catch (err) {
      console.error("❌ Lỗi khi lưu báo cáo:", err);
      messageApi.error("Lưu báo cáo thất bại! Vui lòng thử lại.");
    }
  };

  return (
    <div className=" bg-white text-black min-h-screen">
      {contextHolder}
      {contextHolderModal}
      <div className="sticky top-0 bg-white z-40 border-b pb-2 pt-2 mb-5 shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">{report.name}</h2>

          <div className="flex gap-2">
            <button
              className="flex items-center gap-1 px-3 py-1.5 text-white rounded"
              style={{ backgroundColor: 'var(--primary)' }}
              onClick={() => setEditMode(!editMode)}
            >
              <FaEye /> {editMode ? "Thoát chỉnh sửa" : "Chỉnh sửa"}
            </button>

            {!isUserView && (
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-white rounded"
                style={{ backgroundColor: 'var(--primary)' }}
                onClick={handleSave}
              >
                <FaSave /> Lưu
              </button>
            )}

            <button
              className="flex items-center gap-1 px-3 py-1.5 text-white rounded"
              style={{ backgroundColor: 'var(--primary)' }}
              onClick={handleExportPdf}
            >
              <FaFilePdf /> Xem PDF
            </button>

            <button
              className="flex items-center gap-1 px-3 py-1.5 text-white rounded"
              style={{ backgroundColor: 'var(--primary)' }}
              onClick={handleExportExcel}
            >
              <FaFileExcel /> Xem EXCEL
            </button>
          </div>
        </div>
      </div>

      {editMode && (
        <div className="mb-6 p-4 border rounded bg-gray-50 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-bold mb-3 text-lg">Thông tin báo cáo</h3>

            <div className="flex gap-2">
              {/* ADD TEXT */}
              <button
                className="px-3 py-1 text-white rounded"
                style={{ backgroundColor: 'var(--primary)' }}
                onClick={() => {
                  const newItem: ReportItem = {
                    id: "new-" + v4(),
                    type: "text",
                    index: report.items.length,
                    object: {
                      id: "new-" + v4(),
                      content: "New",
                      fontSize: 12,
                      fontName: "Times New Roman",
                      fontStyle: [],
                      align: "left",
                    },
                  };
                  setReport({ ...report, items: [...report.items, newItem] });
                }}
              >
                + Text
              </button>

              {/* ADD TABLE */}
              <button
                className="px-3 py-1 text-white rounded"
                style={{ backgroundColor: 'var(--primary)' }}
                onClick={() => {
                  const newItem: ReportItem = {
                    id: "new-" + v4(),
                    type: "table",
                    index: report.items.length,
                    object: {
                      id: "new-" + v4(),
                      title: "",
                      width: "100%",
                      columns: [],
                    },
                  };
                  setReport({ ...report, items: [...report.items, newItem] });
                }}
              >
                + Table
              </button>

              {/* ADD DATA */}
              <button
                className="px-3 py-1 text-white rounded"
                style={{ backgroundColor: 'var(--primary)' }}
                onClick={() => {
                  const newItem: ReportItem = {
                    id: "new-" + v4(),
                    type: "data",
                    index: report.items.length,
                    object: {
                      id: "new-" + v4(),
                      mainTable: "",
                      showIndex: false,
                      weightIndex: 1,
                      description: "",
                      fontName: "Times New Roman",
                      fontSize: 12,
                      selectAdvance: "",
                      groupAdvance: "",
                      subs: [],
                      filters: [],
                      fields: [],
                      orders: [],
                      groups: [],
                    },
                  };
                  setReport({ ...report, items: [...report.items, newItem] });
                }}
              >
                + Data
              </button>
            </div>
          </div>

          {/* NAME + PAGE TYPE */}
          <div className="">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="font-semibold">Tên báo cáo:</label>
                <input
                  className="border p-2 w-full rounded mt-1"
                  value={report.name}
                  onChange={(e) =>
                    setReport({ ...report, name: e.target.value })
                  }
                />
              </div>

              <div className="w-48">
                <label className="font-semibold">Loại khổ giấy:</label>
                <select
                  className="border p-2 w-full rounded mt-1"
                  value={report.pageType}
                  onChange={(e) =>
                    setReport({
                      ...report,
                      pageType: e.target.value as "portrait" | "landscape",
                    })
                  }
                >
                  <option value="PORTRAIT">Khổ Dọc</option>
                  <option value="LANDSCAPE">Khổ Ngang</option>
                </select>
              </div>
            </div>
          </div>

          {/* MARGINS */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="font-semibold">Trái:</label>
              <input
                type="number"
                className="border p-2 w-full rounded"
                value={report.marginLeft}
                onChange={(e) =>
                  setReport({ ...report, marginLeft: +e.target.value })
                }
              />
            </div>

            <div>
              <label className="font-semibold">Phải:</label>
              <input
                type="number"
                className="border p-2 w-full rounded"
                value={report.marginRight}
                onChange={(e) =>
                  setReport({ ...report, marginRight: +e.target.value })
                }
              />
            </div>

            <div>
              <label className="font-semibold">Trên:</label>
              <input
                type="number"
                className="border p-2 w-full rounded"
                value={report.marginTop}
                onChange={(e) =>
                  setReport({ ...report, marginTop: +e.target.value })
                }
              />
            </div>

            <div>
              <label className="font-semibold">Dưới:</label>
              <input
                type="number"
                className="border p-2 w-full rounded"
                value={report.marginBottom}
                onChange={(e) =>
                  setReport({ ...report, marginBottom: +e.target.value })
                }
              />
            </div>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="report-items">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {report.items
                .sort((a, b) => a.index - b.index)
                .map((item, idx) => (
                  <Draggable key={item.id} draggableId={item.id} index={idx}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        style={provided.draggableProps.style as React.CSSProperties}
                        {...provided.dragHandleProps}
                        className={`mb-5 p-3 rounded border bg-gray-100 ${
                          editMode ? "" : "border-none p-0 bg-transparent"
                        }`}
                      >
                        {editMode && (
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-bold">
                              {idx + 1}. {item.type.toUpperCase()}
                            </span>
                            <button
                              onClick={() => deleteItem(idx)}
                              className="flex items-center gap-1 px-3 py-1.5 text-white rounded"
                              style={{ backgroundColor: 'var(--primary)' }}
                            >
                              <FaTrash /> Xoá
                            </button>
                          </div>
                        )}

                        {item.type === "text" && (
                          <TextComponent
                            text={item.object as Text}
                            editMode={editMode}
                            onChange={(updated) => {
                              if (!report) return;
                              const updatedItems = report.items.map((i) =>
                                i.id === item.id ? { ...i, object: updated } : i
                              );
                              setReport({ ...report, items: updatedItems });
                            }}
                          />
                        )}

                        {item.type === "table" && (
                          <TableComponent
                            table={item.object as Table}
                            editMode={editMode}
                            onChange={(updatedTable) => {
                              if (!report) return;
                              const updatedItems = report.items.map((i) =>
                                i.id === item.id
                                  ? { ...i, object: updatedTable }
                                  : i
                              );
                              setReport({ ...report, items: updatedItems });
                            }}
                          />
                        )}

                        {item.type === "data" && (
                          <DataComponent
                            data={item.object as Data}
                            editMode={editMode}
                            onChange={(updated) => {
                              if (!report) return;
                              const updatedItems = report.items.map((i) =>
                                i.id === item.id ? { ...i, object: updated } : i
                              );
                              setReport({ ...report, items: updatedItems });
                            }}
                          />
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <PdfPreviewModal
        open={pdfModalOpen}
        pdfUrl={pdfUrl}
        fileName={fileName}
        setFileName={setFileName}
        onClose={() => setPdfModalOpen(false)}
      />
    </div>
  );
};

export default ReportDetail;
