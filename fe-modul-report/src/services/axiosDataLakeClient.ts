import axios from "axios";
import type { ApiError } from "./erorr";
import { message } from "antd";

const axiosDataLakeClient = axios.create({
  baseURL: import.meta.env.VITE_DATALAKE_API,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000000000,
});

axiosDataLakeClient.interceptors.response.use(
  (response) => response,
  (error): Promise<never> => {
    const detail = error.response?.data?.detail;
    const msg =
      typeof detail === "string"
        ? detail
        : error.message || "Lỗi kết nối DataLake";

    const apiError: ApiError = {
      status: error.response?.status || 0,
      message: msg,
      data: error.response?.data,
    };

    message.error(msg);
    return Promise.reject(apiError);
  }
);

export default axiosDataLakeClient;
