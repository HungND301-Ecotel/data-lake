package com.quangnt0000.be_modul.enums;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Danh mục quyền và vai trò nền tảng.
 *
 * <p>Mã quyền lấy từ bảng API nội bộ (tài liệu mục 8.1); ma trận vai trò lấy từ
 * phụ lục A. Tập vai trò ở đây phải khớp với {@code ROLE_PERMISSIONS} phía
 * worker (ai_worker_lake_house/app/security/identity.py) vì worker suy ra quyền
 * từ claim {@code roles} khi token không mang claim {@code perms}.
 */
public final class IamCatalog {

    private IamCatalog() {
    }

    // ---- Permission codes ------------------------------------------------
    public static final String DATA_UPLOAD = "data.upload";
    public static final String DATA_READ = "data.read";
    public static final String DATA_DOWNLOAD = "data.download";
    public static final String PIPELINE_EXECUTE = "pipeline.execute";
    public static final String JOB_READ = "job.read";
    public static final String SEARCH_EXECUTE = "search.execute";
    public static final String AI_CHAT = "ai.chat";
    public static final String REPORT_GENERATE = "report.generate";
    public static final String REPORT_DESIGN = "report.design";
    public static final String CATALOG_MANAGE = "catalog.manage";
    public static final String API_DESIGN = "api.design";
    public static final String BI_MANAGE = "bi.manage";
    public static final String QUALITY_MANAGE = "quality.manage";
    public static final String APPROVAL_DECIDE = "approval.decide";
    public static final String AUDIT_READ = "audit.read";
    public static final String IAM_MANAGE = "iam.manage";
    public static final String ADMIN_MANAGE = "admin.manage";

    /** code -> {tên hiển thị, nhóm}. */
    public static final Map<String, String[]> PERMISSIONS = Map.ofEntries(
            Map.entry(DATA_UPLOAD, new String[]{"Tải dữ liệu lên", "Dữ liệu"}),
            Map.entry(DATA_READ, new String[]{"Đọc metadata dữ liệu", "Dữ liệu"}),
            Map.entry(DATA_DOWNLOAD, new String[]{"Tải nội dung đối tượng", "Dữ liệu"}),
            Map.entry(PIPELINE_EXECUTE, new String[]{"Chạy pipeline xử lý", "Pipeline"}),
            Map.entry(JOB_READ, new String[]{"Theo dõi job", "Pipeline"}),
            Map.entry(SEARCH_EXECUTE, new String[]{"Tìm kiếm", "Khai thác"}),
            Map.entry(AI_CHAT, new String[]{"Chat AI", "Khai thác"}),
            Map.entry(REPORT_GENERATE, new String[]{"Sinh báo cáo", "Báo cáo"}),
            Map.entry(REPORT_DESIGN, new String[]{"Thiết kế mẫu báo cáo", "Báo cáo"}),
            Map.entry(CATALOG_MANAGE, new String[]{"Quản trị danh mục dữ liệu", "Quản trị dữ liệu"}),
            Map.entry(API_DESIGN, new String[]{"Thiết kế Dynamic API", "Tích hợp"}),
            Map.entry(BI_MANAGE, new String[]{"Quản trị kết nối BI", "Tích hợp"}),
            Map.entry(QUALITY_MANAGE, new String[]{"Quản trị chất lượng dữ liệu", "Quản trị dữ liệu"}),
            Map.entry(APPROVAL_DECIDE, new String[]{"Phê duyệt/từ chối", "Quản trị dữ liệu"}),
            Map.entry(AUDIT_READ, new String[]{"Đọc nhật ký kiểm toán", "An toàn thông tin"}),
            Map.entry(IAM_MANAGE, new String[]{"Quản trị danh tính", "An toàn thông tin"}),
            Map.entry(ADMIN_MANAGE, new String[]{"Quản trị hệ thống", "An toàn thông tin"})
    );

    // ---- Role codes ------------------------------------------------------
    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_SECURITY_OFFICER = "SECURITY_OFFICER";
    public static final String ROLE_DATA_OWNER = "DATA_OWNER";
    public static final String ROLE_DATA_STEWARD = "DATA_STEWARD";
    public static final String ROLE_DATA_UPLOADER = "DATA_UPLOADER";
    public static final String ROLE_ANALYST = "ANALYST";
    public static final String ROLE_AI_USER = "AI_USER";
    public static final String ROLE_API_DESIGNER = "API_DESIGNER";
    public static final String ROLE_BI_ADMIN = "BI_ADMIN";
    public static final String ROLE_QUALITY_REVIEWER = "QUALITY_REVIEWER";
    public static final String ROLE_RECORDS_MANAGER = "RECORDS_MANAGER";
    public static final String ROLE_AUDITOR = "AUDITOR";
    /** Vai trò cũ trong dữ liệu hiện có; ánh xạ như người dùng nghiệp vụ. */
    public static final String ROLE_USER = "USER";

    /**
     * Định nghĩa vai trò nền tảng: tên, mức mật tối đa, được đọc chéo đơn vị,
     * và tập quyền.
     */
    public record RoleDef(String code, String name, int maxClearance, boolean crossOrg,
                          Set<String> permissions) {
    }

    public static final List<RoleDef> ROLES = List.of(
            new RoleDef(ROLE_ADMIN, "Quản trị nền tảng", 4, true,
                    Set.of(DATA_UPLOAD, DATA_READ, DATA_DOWNLOAD, PIPELINE_EXECUTE, JOB_READ,
                            SEARCH_EXECUTE, AI_CHAT, REPORT_GENERATE, REPORT_DESIGN, API_DESIGN,
                            CATALOG_MANAGE, BI_MANAGE, QUALITY_MANAGE,
                            APPROVAL_DECIDE, AUDIT_READ, IAM_MANAGE, ADMIN_MANAGE)),
            new RoleDef(ROLE_SECURITY_OFFICER, "Cán bộ an toàn thông tin", 4, true,
                    Set.of(DATA_READ, JOB_READ, AUDIT_READ, IAM_MANAGE, ADMIN_MANAGE,
                            APPROVAL_DECIDE)),
            new RoleDef(ROLE_DATA_OWNER, "Chủ sở hữu dữ liệu", 3, false,
                    // Chủ sở hữu là người duyệt ngưỡng chất lượng của dataset mình
                    // sở hữu (phụ lục A, M06).
                    Set.of(DATA_READ, DATA_DOWNLOAD, JOB_READ, APPROVAL_DECIDE,
                            REPORT_GENERATE, SEARCH_EXECUTE, CATALOG_MANAGE,
                            QUALITY_MANAGE)),
            new RoleDef(ROLE_DATA_STEWARD, "Quản lý dữ liệu", 3, false,
                    Set.of(DATA_UPLOAD, DATA_READ, DATA_DOWNLOAD, PIPELINE_EXECUTE, JOB_READ,
                            SEARCH_EXECUTE, CATALOG_MANAGE, QUALITY_MANAGE)),
            new RoleDef(ROLE_DATA_UPLOADER, "Người tải dữ liệu", 2, false,
                    Set.of(DATA_UPLOAD, DATA_READ, JOB_READ)),
            new RoleDef(ROLE_ANALYST, "Chuyên viên phân tích", 2, false,
                    Set.of(DATA_READ, JOB_READ, SEARCH_EXECUTE, REPORT_GENERATE,
                            REPORT_DESIGN)),
            new RoleDef(ROLE_AI_USER, "Người dùng AI", 2, false,
                    Set.of(DATA_READ, SEARCH_EXECUTE, AI_CHAT)),
            new RoleDef(ROLE_API_DESIGNER, "Thiết kế API", 2, false,
                    // Chỉ đọc danh mục để chọn dataset; không được sửa danh mục
                    // và không được tự publish (phụ lục A).
                    Set.of(DATA_READ, API_DESIGN, SEARCH_EXECUTE)),
            new RoleDef(ROLE_BI_ADMIN, "Quản trị BI", 2, false,
                    // Chỉ dựng view trên gold_bi và ánh xạ RLS; không sửa danh mục,
                    // không chạm Bronze/Silver (phụ lục A, M12).
                    Set.of(DATA_READ, SEARCH_EXECUTE, BI_MANAGE)),
            new RoleDef(ROLE_QUALITY_REVIEWER, "Kiểm định chất lượng dữ liệu", 2, false,
                    // Khai báo và chạy rule, nhưng không sửa danh mục.
                    Set.of(DATA_READ, SEARCH_EXECUTE, QUALITY_MANAGE)),
            new RoleDef(ROLE_RECORDS_MANAGER, "Quản lý hồ sơ lưu trữ", 3, true,
                    // Đồng duyệt việc huỷ hồ sơ hết hạn và đặt/gỡ legal hold
                    // (phụ lục A, M07).
                    Set.of(DATA_READ, AUDIT_READ, APPROVAL_DECIDE)),
            new RoleDef(ROLE_AUDITOR, "Kiểm toán viên", 4, true,
                    Set.of(DATA_READ, AUDIT_READ)),
            new RoleDef(ROLE_USER, "Người dùng nghiệp vụ", 2, false,
                    Set.of(DATA_UPLOAD, DATA_READ, JOB_READ, SEARCH_EXECUTE, REPORT_GENERATE))
    );

    /** Đơn vị gốc mặc định, trùng mã với bản seed của worker. */
    public static final String DEFAULT_ORG_CODE = "ORG-ROOT";
}
