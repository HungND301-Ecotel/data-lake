// src/api/report.ts
export interface Report {
    id: string;
    name: string;
    type: string; // Word | Excel | PDF
    reportMode: "Static" | "Dynamic";
    createdAt: string;
  }
  
  export interface ReportCategory {
    id: string;
    name: string;
    departmentId: string;
  }
  
  export interface Department {
    id: string;
    name: string;
    categories: ReportCategory[];
  }
  
  // Lấy tất cả phòng ban kèm đầu mục
  export const fetchDepartments = async (): Promise<Department[]> => {
    return [
      {
        id: "d1",
        name: "Kinh doanh",
        categories: [
          { id: "c1", name: "Báo cáo ngày", departmentId: "d1" },
          { id: "c2", name: "Báo cáo tháng", departmentId: "d1" },
        ],
      },
      {
        id: "d2",
        name: "Kho",
        categories: [{ id: "c3", name: "Báo cáo tồn kho", departmentId: "d2" }],
      },
    ];
  };
  
  // Lấy báo cáo theo đầu mục
  export const fetchReportsByCategory = async (categoryId: string): Promise<Report[]> => {
    const allReports: Record<string, Report[]> = {
      c1: [
        { id: "r1", name: "Bán hàng hôm nay", type: "Word", reportMode: "Static", createdAt: "2025-11-30" },
      ],
      c2: [
        { id: "r2", name: "Báo cáo tháng 11", type: "Excel", reportMode: "Dynamic", createdAt: "2025-11-28" },
      ],
      c3: [
        { id: "r3", name: "Tồn kho cuối ngày", type: "Excel", reportMode: "Dynamic", createdAt: "2025-11-29" },
      ],
    };
    return allReports[categoryId] || [];
  };
  