export interface GoldExtractRequest {
  file_id: string;
  prompt: string;
  columns_to_extract?: string[];
}

export interface GoldRecord {
  gold_id: string;
  file_id: string;
  structured_data_url: string;
  confirmed: boolean;
}

export interface GoldListResponse {
  total: number;
  records: GoldRecord[];
}

export interface GoldPrompt {
  prompt_id: string;
  prompt_text: string;
  columns_to_extract: string[];
  description: string | null;
}

export interface GoldPromptCreateRequest {
  prompt_text: string;
  columns_to_extract?: string[];
  description?: string;
}
