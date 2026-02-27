import axiosDataLakeClient from "../../../services/axiosDataLakeClient";
import type {
  AnalyzeSchemaRequest,
  AnalyzeSchemaResponse,
  AsyncAnalyzeResponse,
  SqlMetadata,
} from "../types/sqlMetadata";

export const sqlMetadataApi = {
  analyzeSchema: async (
    data: AnalyzeSchemaRequest,
    asyncMode = false
  ): Promise<AnalyzeSchemaResponse | AsyncAnalyzeResponse> => {
    const res = await axiosDataLakeClient.post(
      "/api/v1/lakehouse/sql/analyze-schema",
      data,
      { params: asyncMode ? { async: true } : undefined }
    );
    return res.data;
  },

  getMetadata: async (analysisId: string): Promise<SqlMetadata> => {
    const res = await axiosDataLakeClient.get(
      `/api/v1/lakehouse/sql/metadata/${analysisId}`
    );
    return res.data;
  },

  getDownloadUrl: (analysisId: string): string =>
    `/api/v1/lakehouse/sql/metadata/${analysisId}/download`,
};
