import axiosClient from "../../../services/axiosClient";
import type { UserPushRequest, UserPushResponse } from "../types/accountConfig";

export const userPushApi = {
  getAllUserPush: async (): Promise<UserPushResponse[]> => {
    const res = await axiosClient.get(`/api/user-push`);
    return res.data;
  },

  getUserPushByUsername: async (username: string): Promise<UserPushResponse> => {
    const res = await axiosClient.get(`/api/user-push/username/${username}`);
    return res.data;
  },

  createUserPush: async (
    request: UserPushRequest
  ): Promise<UserPushResponse> => {
    const res = await axiosClient.post(`/api/user-push`, request);
    return res.data;
  },

  updateUserPush: async (
    id: string,
    request: UserPushRequest
  ): Promise<UserPushResponse> => {
    const res = await axiosClient.put(`/api/user-push/${id}`, request);
    return res.data;
  },

  deleteUserPush: async (id: string): Promise<UserPushResponse> => {
    const res = await axiosClient.delete(`/api/user-push/${id}`);
    return res.data;
  },
};