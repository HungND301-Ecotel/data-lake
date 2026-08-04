export interface ApiError {
    status: number;
    message: string;
    data?: any;
  }
  
  export const getErrorMessage = (error: any, fallback: string): string => {
    if (typeof error === 'string') return error;
    if (error?.message && error.message !== "Lỗi server" && error.message !== "Dữ liệu không hợp lệ" && error.message !== "Đã xảy ra lỗi") {
      return error.message;
    }
    if (typeof error?.data === 'string') return error.data;
    if (error?.data?.message) return error.data.message;
    return error?.message || fallback;
  };