import type { Report } from "../types/report";
import axiosClient from "../../../services/axiosClient";

export const excelApi = {
  getFile: async (fileKey: string): Promise<Blob> => {
    const res = await axiosClient.get("/file", {
      params: { fileKey },
      responseType: "blob",
    });
    return res.data;
  },


  saveFile: async (file: Blob | File): Promise<any> => {
    const formData = new FormData();
    formData.append("file", file);
  
    const res = await axiosClient.post("/file/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  
    return res.data;
  },

  exportExcel: async (report: Report) => {
    const res = await axiosClient.post("/excel", report, {
      responseType: "arraybuffer",
    });
    return res.data;
  },
  
   
};
