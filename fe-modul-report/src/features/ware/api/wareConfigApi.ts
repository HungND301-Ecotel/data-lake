import axiosClient from "../../../services/axiosClient";

// ============ APPROVAL CONFIGS APIs ============
export const approvalConfigsApi = {
  getByTemplateId: async (templateId: string) => {
    try {
      const response = await axiosClient.get(`/wh-template/${templateId}/approval-configs`);
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy cấu hình phê duyệt:", error);
      throw error;
    }
  },

  update: async (templateId: string, data: any) => {
    try {
      const response = await axiosClient.put(`/wh-template/${templateId}/approval-configs`, {
        configs: data.configs || [],
      });
      return response.data;
    } catch (error) {
      console.error("Lỗi khi cập nhật cấu hình phê duyệt:", error);
      throw error;
    }
  },
};