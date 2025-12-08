import type { LoginResponse, UserLogin, UserRequest, UserResponse } from "../types/user";
import axiosClient from "./axiosClient";

export const userApi = {
    addUser: async (request: UserRequest): Promise<string> => {
      const res = await axiosClient.post("/user", request);
      return res.data;
    },

    updateUser: async (request: UserRequest): Promise<string> => {
        const res = await axiosClient.put("/user", request);
        return res.data;
    },

  login: async (request: UserLogin): Promise<LoginResponse> => {
    const res = await axiosClient.post("/user/login", request);
    return res.data;
  },
  
    deleteEmployee: async (employeeId: String | null): Promise<string> => {
      const res = await axiosClient.delete(`/user/${employeeId}`);
      return res.data;
    },

    getByEmployeeId: async (employeeId: String | null): Promise<UserResponse> => {
      const res = await axiosClient.get(`/user/employee/${employeeId}`);
      return res.data;
    },
    
};