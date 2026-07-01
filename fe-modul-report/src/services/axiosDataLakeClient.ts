import axios from "axios";
import type { ApiError } from "./erorr";
import { message } from "antd";

import { getTenantConfig } from "../config/tenant";

const axiosDataLakeClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000000000,
});

axiosDataLakeClient.interceptors.request.use((config) => {
  config.baseURL = getTenantConfig().apiTarget;
  return config;
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
