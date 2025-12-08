import axiosClient from "./axiosClient";

export const fileApi = {
  getFile: async (fileKey: string): Promise<Blob> => {
    const res = await axiosClient.get("/file", {
      params: { fileKey },
      responseType: "blob",
    });
    return res.data;
  },
};
