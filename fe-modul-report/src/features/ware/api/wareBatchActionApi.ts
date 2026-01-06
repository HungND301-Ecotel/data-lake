import axiosClient from "../../../services/axiosClient";
import type { PageResponse } from "../../department/types/department";
import type { TimeCountDto, WareBatchActionResponse, WareBatchActionSearch, WareBatchActionStatistic } from "../types/wareBatchAction";

export const wareBatchActionApi = {
  searchWareActionBatch: async (
    params: WareBatchActionSearch
  ): Promise<PageResponse<WareBatchActionResponse>> => {
    const res = await axiosClient.get(`/ware-batch-action`, { params });
    return res.data;
  },

  // deleteWareBatch: async (id: string): Promise<string> => {
  //   const res = await axiosClient.delete(`/wh-batch/${id}`);
  //   return res.data;
  // },

  getDashboard: async (): Promise<WareBatchActionStatistic> => {
    const res = await axiosClient.get(`/ware-batch-action/dashboard`);
    return res.data;
  },

  cntActionTime: async (type: string): Promise<TimeCountDto[]> => {
    const res = await axiosClient.get(`/ware-batch-action/cnt-time/${type}`);
    return res.data;
  },

  getTop10ByMonth: async (): Promise<TimeCountDto[]> => {
    const res = await axiosClient.get(`/ware-batch-action/top-table`);
    return res.data;
  },

};