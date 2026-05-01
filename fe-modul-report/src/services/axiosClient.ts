import axios from "axios";
import type { ApiError } from "./erorr";
import { message } from "antd";
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error): Promise<never> => {
    let apiError: ApiError;

    if (!error.response) {
      apiError = {
        status: 0,
        message: "Không thể kết nối tới server",
      };
      return Promise.reject(apiError);
    }

    const { status, data } = error.response;

    switch (status) {
      case 400:
        apiError = {
          status,
          message: data?.message || "Dữ liệu không hợp lệ",
          data,
        };
        break;

      case 401:
        localStorage.removeItem("token");
        message.error("Phiên đăng nhập đã hết hạn");
        window.location.href = "/login";
        apiError = {
          status,
          message: "Phiên đăng nhập đã hết hạn",
        };
        break;

      case 403:
        apiError = {
          status,
          message:
            typeof data === "string"
              ? data
              : data?.message || "Bạn không có quyền truy cập",
        };
        break;

      case 404:
        apiError = {
          status,
          message:
            typeof data === "string"
              ? data
              : data?.message || "API không tồn tại",
        };
        break;

      case 422:
        apiError = {
          status,
          message:
            typeof data === "string" ? data : data?.message || "Lỗi validation",
          data,
        };
        break;

      case 500:
        apiError = {
          status,
          message:
            typeof data === "string" ? data : data?.message || "Lỗi server",
          data,
        };
        break;

      default:
        apiError = {
          status,
          message: data?.message || "Đã xảy ra lỗi",
        };
    }

    axiosClient.interceptors.response.use(
      (response) => response,
      (error) => {
        const msg = error.response?.data?.message || "Lỗi hệ thống";
        message.error(msg);
        return Promise.reject(error);
      }
    );

    return Promise.reject(apiError);
  }
);

export default axiosClient;
