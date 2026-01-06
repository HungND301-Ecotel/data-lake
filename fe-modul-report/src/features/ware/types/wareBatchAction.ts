export interface WareBatchActionResponse {
    id: number;
  
    actionName: string;
    tableName: string;
    burks: string;

    deleted: boolean;
    requestId: string;

    createdAt: string;
    updatedAt: string;
  }

  export interface WareBatchActionSearch {
    page: number;
    limit: number;
  
    actionName: string;
    tableName: string;
  
    sortBy: string | null;
    sort: 'ASC' | 'DESC' | null;
  }
  

  export interface WareBatchActionStatistic {
    insert_today: number;
    update_today: number;
    insert_total: number;
    update_total: number;
  }

  export interface TimeCountDto {
    label: string; // ngày / tháng / năm
    total: number;
  }
  
  
  