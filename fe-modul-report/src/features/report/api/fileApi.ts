import axiosClient from "../../../services/axiosClient";

export const fileApi = {
  getFile: async (fileKey: string): Promise<Blob> => {
    const res = await axiosClient.get("/file", {
      params: { fileKey },
      responseType: "blob",
    });
    return res.data;
  },

  getFileV2: async (fileKey: string): Promise<Blob> => {
    const res = await axiosClient.get("/file/v2", {
      params: { fileKey },
      responseType: "blob",
    });
    return res.data;
  },

  getFileV3: async (fileKey: string): Promise<Blob> => {
    const res = await axiosClient.get("/file/v3", {
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
  
   
};
