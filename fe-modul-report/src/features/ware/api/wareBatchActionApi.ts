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

  getDashboard: async (configId?: string): Promise<WareBatchActionStatistic> => {
    const res = await axiosClient.get(`/ware-batch-action/dashboard`, { params: { configId } });
    return res.data;
  },

  cntActionTime: async (type: string, configId?: string): Promise<TimeCountDto[]> => {
    const res = await axiosClient.get(`/ware-batch-action/cnt-time/${type}`, { params: { configId } });
    return res.data;
  },

  getTop10ByMonth: async (configId?: string): Promise<TimeCountDto[]> => {
    const res = await axiosClient.get(`/ware-batch-action/top-table`, { params: { configId } });
    return res.data;
  },

};