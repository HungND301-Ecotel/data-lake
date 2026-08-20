import axiosClient from "../../../services/axiosClient";
import type { GetRequest, GetResponse } from "../types/getMaster";

export const wareTkvApi = {
  searchTkv: async (request: GetRequest): Promise<GetResponse> => {
    const res = await axiosClient.post(`/ware-api/get`, request);
    return res.data;
  },

};
