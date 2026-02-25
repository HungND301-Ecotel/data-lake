import axiosDataLakeClient from "../../../services/axiosDataLakeClient";
import type { ExcelMappingResponse } from "../types/excelMapping";

export const excelMappingApi = {
  analyze: async (file: File): Promise<ExcelMappingResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await axiosDataLakeClient.post(
      "/api/v1/lakehouse/excel-mapping/analyze",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res.data;
  },
};
