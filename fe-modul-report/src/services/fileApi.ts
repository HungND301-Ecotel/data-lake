import axiosClient from "./axiosClient";

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
};
