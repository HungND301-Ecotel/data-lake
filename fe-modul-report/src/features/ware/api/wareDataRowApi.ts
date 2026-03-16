import axiosClient from "../../../services/axiosClient";
import type { PageResponse } from "../../department/types/department";
import type { WareDataRowResponse, WareDataRowSearch } from "../types/wareDataRow";

export const wareDataRowApi = {
  searchWareDataRow: async (
    params: WareDataRowSearch
  ): Promise<PageResponse<WareDataRowResponse>> => {
    const res = await axiosClient.get(`/wh-data-row`, { params });
    return res.data;
  },

  // saveWareDataRow: async (
  //   request: WareDataRowRequest
  // ): Promise<string> => {
  //   const res = await axiosClient.post(`/wh-batch`, request);
  //   return res.data;
  // },

  // updateWareDataRow: async (
  //   request: WareDataRowRequest
  // ): Promise<string> => {
  //   const res = await axiosClient.post(`/wh-batch`, request);
  //   return res.data;
  // },

//   deleteWareDataRow: async (id: string): Promise<string> => {
//     const res = await axiosClient.delete(`/wh-batch/${id}`);
//     return res.data;
//   },

};
