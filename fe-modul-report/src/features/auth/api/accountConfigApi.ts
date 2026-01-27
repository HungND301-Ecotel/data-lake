import axiosClient from "../../../services/axiosClient";
import type { UserPushRequest, UserPushResponse } from "../types/accountConfig";

export const userPushApi = {
  getAllUserPush: async (): Promise<UserPushResponse[]> => {
    const res = await axiosClient.get(`/user-push`);
    return res.data;
  },

  getUserPushByUsername: async (username: string): Promise<UserPushResponse> => {
    const res = await axiosClient.get(`/user-push/username/${username}`);
    return res.data;
  },

  createUserPush: async (
    request: UserPushRequest
  ): Promise<UserPushResponse> => {
    const res = await axiosClient.post(`/user-push`, request);
    return res.data;
  },

  updateUserPush: async (
    id: string,
    request: UserPushRequest
  ): Promise<UserPushResponse> => {
    const res = await axiosClient.put(`/user-push/${id}`, request);
    return res.data;
  },

  deleteUserPush: async (id: string): Promise<UserPushResponse> => {
    const res = await axiosClient.delete(`/user-push/${id}`);
    return res.data;
  },
};