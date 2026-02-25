export interface ColumnMapping {
  excel_column_index: number;
  excel_column_name: string;
  mapped_key: string;
  mapped_name: string;
  data_type: string;
  data_length: number;
}

export interface ExcelMappingResult {
  company_id: string | null;
  company_name: string | null;
  day: number | null;
  month: number | null;
  year: number | null;
  header_row: number;
  data_start_row: number;
  column_mapping: ColumnMapping[];
}

export interface ExcelMappingResponse {
  success: boolean;
  filename: string;
  result: ExcelMappingResult;
}
