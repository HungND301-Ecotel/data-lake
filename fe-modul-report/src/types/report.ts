export interface Report {
  id: string | null;
  name: string;
  pageType: "landscape" | "portrait";   // ngang = landscape, dọc = portrait
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  items: ReportItem[] | [];
}

export interface ReportItem {
    id: string ;
    type: "text" | "table" | "data";
    index: number;
    object: Text | Table | Data;
}

export interface Text {
    id: string | null;
    content: string

    //style
    fontSize: number;
    fontName: string;
    fontStyle: string[]; // ["bold", "italic", "underline"]
    align: "left" | "center" | "right";
  }


export interface Data {
  id: string | null;
  mainTable: string;
  showIndex: boolean;
  url?: string | null;
  username?: string | null;
  password?: string | null;
  weightIndex: number;
  description: string;
  fontName: string;
  fontSize: number;
  subs: Sub[];
  filters: Filter[];
  fields: Field[];
  orders: Order[];
  groups: Group[];
}

export interface Sub {
  id: string | null;
  tableName: string;
  joinType: "LEFT JOIN" | "RIGHT JOIN" | "INNER JOIN" | "FULL JOIN";
  joinOn: string;
}

export interface Filter {
  id: string | null;
  alias: string;
  fieldKey: string;            // tên cột DB
  operatorList: string;      // danh sách toán tử
  valueType: string;
  defaultValue?: string | number | boolean | null;
  defaultOperator?: string;
  queryValue?: string;
  
}

export interface Field {
  id: string | null;
  alias: string;        // tên hiển thị (VD: "Họ tên")
  fieldKey: string;     // tên cột trong DB hoặc key dữ liệu
  dataType: string;     // kiểu dữ liệu (String, Number, Date, ...)
  weight: number;      // độ rộng cột (có thể optional)
  visible: boolean;    // có hiển thị hay không
  index: number;       // thứ tự cột
  groupName: string;   // tên nhóm (nếu có)
  alignment: number;
}

export interface Order {
  id: string | null;
  title: string;       // tiêu đề phần order
  fieldKey: string;    // tên trường trong DB
  orderType: "ASC" | "DESC"; // kiểu sắp xếp
  visible: boolean;   // có hiển thị hay không
  index: number; 
}

export interface Group {
  id: string | null;
  title: string;       // tiêu đề phần order
  fieldKey: string;    // tên trường trong DB
  visible: boolean;   // có hiển thị hay không
  index: number; 
}

export interface Table {
    id: string | null;
    title: string;
    columns: TableItem[];
    width: string;
}

export interface TableItem {
  id: string | null;
  row: number;           // index hàng
  col: number;           // index cột
  
  type: "text" | "query";   // text hay query

  // Dành cho type = text
  text?: string;
  fontName?: string;
  fontSize?: number;
  fontStyle?: ("bold" | "italic" | "underline")[];
  align?: "left" | "center" | "right" | "justify";

  //query
  queryFilters: Filter[];
  querySyntax: string;

  colSpan: number;
  rowSpan: number;
  border: string;
}


// Dùng để gửi dữ liệu từ frontend sang backend
export interface ReportCategoryRequest {
  id?: string | null;           // optional nếu tạo mới
  code: string;
  name: string;
  description?: string;  // optional nếu không bắt buộc
  departmentId: string;
}

// Dùng để nhận dữ liệu từ backend
export interface ReportCategoryResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  departmentId: string;
  departmentName: string;
}

export interface ReportCategorySearch {
  page?: number;      
  limit?: number;   
  keyword?: string;   
  sort?: "ASC" | "DESC";
  sortBy?: string;  
  departmentId?: string | null; 
}


export type ReportCategoryCount = Record<string, number>;
