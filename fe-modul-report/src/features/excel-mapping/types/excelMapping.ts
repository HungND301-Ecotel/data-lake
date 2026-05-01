export interface ColumnMapping {
  excel_column_index: number;
  excel_column_name: string;
  mapped_key: string | null;
  mapped_name: string | null;
  data_type: string | null;
  data_length: number | null;
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
