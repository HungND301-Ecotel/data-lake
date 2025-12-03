// services/report/fetch.ts
export interface Attachment {
    id: number;
    name: string;
    size: string;
    uploadedAt: string;
    s3Key: string;
  }
  
  export interface Approval {
    id: number;
    status: string;
    description: string;
    approver: string;
    approverAvatar?: string;
    approverPosition?: string;
    createdAt: string;
    comment?: string;
  }
  
  export interface Report {
    key: string;
    name: string;
    type: string;
    department: string;
    category: string;
    creator: string;
    creatorAvatar?: string;
    creatorPosition?: string;
    createdAt: string;
    updatedAt: string;
    description: string;
    status: string;
    fileSize: string;
    version: string;
    reportFile: string;
    attachments: Attachment[];
    approvalTimeline: Approval[];
  }
  
  // Fake fetch API
  export const fetchReports = async (): Promise<Report[]> => {
    return [
      {
        key: "1",
        name: "Báo cáo bán hàng",
        type: "Word",
        department: "Kinh doanh",
        category: "Báo cáo doanh số",
        creator: "Nguyễn A",
        creatorAvatar: "https://i.pravatar.cc/150?img=1",
        creatorPosition: "Nhân viên kinh doanh",
        createdAt: "2025-11-30",
        updatedAt: "2025-12-01",
        description: "Báo cáo bán hàng tháng 11",
        status: "Chờ duyệt",
        fileSize: "2 MB",
        version: "v1.0",
        reportFile: "s3_001",
        attachments: [
          { id: 1, name: "Báo cáo tháng 11.docx", size: "2 MB", uploadedAt: "2025-11-30", s3Key: "s3_001" },
        ],
        approvalTimeline: [
          { id: 1, status: "Tạo", description: "Nhân viên tạo báo cáo", approver: "Nguyễn A", approverAvatar: "https://i.pravatar.cc/150?img=1", approverPosition: "Nhân viên kinh doanh", createdAt: "2025-11-30", comment: "Khởi tạo báo cáo" },
          { id: 2, status: "Chờ duyệt", description: "Trưởng phòng duyệt", approver: "Trần B", approverAvatar: "https://i.pravatar.cc/150?img=2", approverPosition: "Trưởng phòng", createdAt: "2025-12-01" },
        ],
      },
      {
        key: "2",
        name: "Báo cáo tồn kho",
        type: "Excel",
        department: "Kho",
        category: "Báo cáo tồn kho",
        creator: "Trần B",
        creatorAvatar: "https://i.pravatar.cc/150?img=2",
        creatorPosition: "Nhân viên kho",
        createdAt: "2025-11-29",
        updatedAt: "2025-12-01",
        description: "Báo cáo tồn kho cuối tháng",
        status: "Đã duyệt",
        fileSize: "3 MB",
        version: "v1.2",
        reportFile: "s3_002",
        attachments: [
          { id: 1, name: "Tồn kho tháng 11.xlsx", size: "3 MB", uploadedAt: "2025-11-29", s3Key: "s3_002" },
          { id: 2, name: "Chi tiết kho.csv", size: "1 MB", uploadedAt: "2025-11-29", s3Key: "s3_003" },
        ],
        approvalTimeline: [
          { id: 1, status: "Tạo", description: "Nhân viên tạo báo cáo", approver: "Trần B", approverAvatar: "https://i.pravatar.cc/150?img=2", approverPosition: "Nhân viên kho", createdAt: "2025-11-29" },
          { id: 2, status: "Duyệt", description: "Quản lý duyệt", approver: "Lê C", approverAvatar: "https://i.pravatar.cc/150?img=3", approverPosition: "Quản lý kho", createdAt: "2025-11-30", comment: "Ok, duyệt" },
          { id: 3, status: "Đã duyệt", description: "Kế toán trưởng ký", approver: "Nguyễn D", approverAvatar: "https://i.pravatar.cc/150?img=4", approverPosition: "Kế toán trưởng", createdAt: "2025-12-01" },
        ],
      },
    ];
  };
  
  // Fetch report theo id
  export const fetchReportById = async (id: string): Promise<Report | null> => {
    const reports = await fetchReports();
    return reports.find((r) => r.key === id) || null;
  };
  