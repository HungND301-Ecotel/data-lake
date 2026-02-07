export interface ColumnMapping {
  source_column: string;
  target_column: string;
  confidence: number;
  data_type: string;
}

export interface ExcelMappingResult {
  columns_detected: number;
  suggested_mappings: ColumnMapping[];
  data_types: Record<string, string>;
}

export interface ExcelMappingResponse {
  success: boolean;
  filename: string;
  result: ExcelMappingResult;
}
