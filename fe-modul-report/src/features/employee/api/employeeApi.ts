import type { PageResponse } from "../../department/types/department";
import type { EmployeeRequest, EmployeeResponse } from "../types/employee";
import axiosClient from "../../../services/axiosClient";

export const employeeApi = {
    searchEmployee: async (
      keyword: string,
      page: number = 0,
      limit: number = 10
    ): Promise<PageResponse<EmployeeResponse>> => {
      const res = await axiosClient.get("/employee", {
        params: { keyword, page, limit },
      });
      return res.data;
    },
  
    saveEmployee: async (request: EmployeeRequest): Promise<string> => {
      const res = await axiosClient.post("/employee", request);
      return res.data;
    },

    updateEmployee: async (request: EmployeeRequest): Promise<string> => {
      const res = await axiosClient.put("/employee", request, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
  
    deleteEmployee: async (employeeId: String | null): Promise<string> => {
      const res = await axiosClient.delete(`/employee/${employeeId}`);
      return res.data;
    },

    getEmployee: async (employeeId: String | null): Promise<EmployeeResponse> => {
      const res = await axiosClient.get(`/employee/${employeeId}`);
      return res.data;
    },

    getMyProfile: async (): Promise<EmployeeResponse> => {
      const res = await axiosClient.get(`/employee/my-profile`);
      return res.data;
    },
    
  };