import axiosClient from "../../../services/axiosClient";
import type { TableOption, WareTemplateRequest, WareTemplateResponse, WareTemplateSearch } from "../types/wareTemplate";

const buildWareTemplateFormData = (request: WareTemplateRequest): FormData => {
  const formData = new FormData();

  if (request.id !== undefined && request.id !== null) {
    formData.append("id", String(request.id));
  }
  if (request.code !== undefined && request.code !== null) {
    formData.append("code", request.code);
  }
  formData.append("name", request.name ?? "");
  formData.append("description", request.description ?? "");
  formData.append("startRow", String(request.startRow ?? 0));
  formData.append("wareCategoryId", String(request.wareCategoryId ?? ""));
  formData.append("tableName", request.tableName ?? "");
  formData.append("tableCode", request.tableCode ?? "");

  if (request.excelFile) {
    formData.append("excelFile", request.excelFile);
  }

  return formData;
};

export const wareTemplateApi = {
  searchWareTemplate: async (
    params: WareTemplateSearch
  ): Promise<WareTemplateResponse[]> => {
    const res = await axiosClient.get(`/wh-template`, { params });
    return res.data;
  },

  saveWareTemplate: async (
    request: WareTemplateRequest
  ): Promise<string> => {
    const res = await axiosClient.post(
      `/wh-template`,
      buildWareTemplateFormData(request),
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data;
  },

  updateWareTemplate: async (
    request: WareTemplateRequest
  ): Promise<string> => {
    const res = await axiosClient.put(
      `/wh-template`,
      buildWareTemplateFormData(request),
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return res.data;
  },

  deleteWareTemplate: async (id: number): Promise<string> => {
    const res = await axiosClient.delete(`/wh-template/${id}`);
    return res.data;
  },


  getWareTemplateById: async (id: number): Promise<WareTemplateResponse> => {
    const res = await axiosClient.get(`/wh-template/${id}`);
    return res.data;
  },

  getOptionTable: async (keyword: string): Promise<TableOption[]> => {
    const res = await axiosClient.get(`/wh-template/table-option`, { params: { keyword } });
    return res.data;
  },

  exportTemplateExcel: async (id: number): Promise<Blob> => {
    const res = await axiosClient.get(`/wh-template/${id}/export-excel`, {
      responseType: "blob",
    });
    return res.data;
  },

  syncTemplateMapping: async (id: number, connectionId: string): Promise<string> => {
    const res = await axiosClient.post(`/wh-template/${id}/sync-mapping`, null, {
      params: { connectionId },
    });
    return res.data;
  },

};
