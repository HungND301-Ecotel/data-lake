import React, { useEffect, useState } from "react";
import { FaSave } from "react-icons/fa";
import { message } from "antd";
import type { DepartmentResponse, PageResponse } from "../../../department/types/department";
import type { ReportCategoryResponse } from "../../types/report";
import { departmentApi } from "../../../department/api/departmentApi";
import { reportCategoryApi } from "../../../category/reportCategory/api/reportCategoryApi";
import type { ReportStorageRequest } from "../../types/reportStorage";
import { reportStorageApi } from "../../api/reportStorageApi";

interface PdfPreviewModalProps {
  open: boolean;
  pdfUrl: string | null;
  fileName: string;
  setFileName: (v: string) => void;
  onClose: () => void;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  open,
  pdfUrl,
  fileName,
  setFileName,
  onClose,
}) => {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [categories, setCategories] = useState<ReportCategoryResponse[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res: PageResponse<DepartmentResponse> = await departmentApi.getMyDepartment(
          "",
          0,
          100
        );
        setDepartments(res.content || []);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (!selectedDept) {
      setCategories([]);
      setSelectedCategory(null);
      return;
    }

    const fetchCategories = async () => {
      try {
        const res = await reportCategoryApi.searchReportCategory({
          departmentId: selectedDept,
          page: 0,
          limit: 50,
        });
        setCategories(res.content || []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };
    fetchCategories();
  }, [selectedDept]);

  const handleSave = async () => {
    if (!pdfUrl) {
      messageApi.error("PDF không tồn tại");
      return;
    }
  
    if (!fileName || !selectedCategory) {
      messageApi.error("Vui lòng nhập tên báo cáo và chọn danh mục");
      return;
    }
  
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
  
      const file = new File([blob], `${fileName}.pdf`, { type: "application/pdf" });
  
      const request: ReportStorageRequest = {
        name: fileName,
        file,
        reportCategoryId: selectedCategory,
        description,
        note,
      };
  
      const res = await reportStorageApi.addReportStorage(request);
      console.log("Upload PDF result:", res);
      messageApi.success("Lưu PDF thành công!");
    } catch (err) {
      console.error("Upload PDF error:", err);
      messageApi.error("Lưu PDF thất bại!");
    }
  };
  

  if (!open || !pdfUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-start pt-10 bg-black/30"
      onClick={onClose}
    >
      {contextHolder}

      <div
        className="w-4/5 h-4/5 bg-white rounded shadow-lg border border-gray-300 flex"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-1/5 p-4 border-r flex flex-col gap-3">
          <label className="font-semibold">Tên báo cáo:</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />

          <label className="font-semibold">Phòng ban:</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={selectedDept || ""}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">-- Chọn phòng ban --</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id || ""}>
                {d.name}
              </option>
            ))}
          </select>

          <label className="font-semibold">Danh mục báo cáo:</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={selectedCategory || ""}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={!selectedDept}
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label className="font-semibold">Mô tả:</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập mô tả"
          />

          <label className="font-semibold">Ghi chú:</label>
          <input
            type="text"
            className="border rounded px-2 py-1 w-full"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nhập ghi chú"
          />

          <button
            className="mt-auto px-3 py-2 bg-[#0891b2] text-white rounded hover:bg-cyan-700 flex items-center gap-1"
            onClick={handleSave}
          >
            <FaSave /> Lưu PDF
          </button>
        </div>

        <div className="flex-1 p-2">
          <iframe
            src={pdfUrl}
            className="w-full h-full rounded"
            title="PDF Preview"
          />
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
