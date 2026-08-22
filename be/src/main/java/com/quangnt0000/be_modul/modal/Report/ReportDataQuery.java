package com.quangnt0000.be_modul.modal.Report;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Truy vấn số liệu có phiên bản và có chủ sở hữu - tài liệu mục 5.3
 * ("số liệu phải lấy từ query/data product có version").
 *
 * <p>Đây là ranh giới giữa báo cáo và dữ liệu: người thiết kế mẫu chỉ được chọn
 * trong danh mục truy vấn đã duyệt, không được viết SQL tự do. Câu lệnh luôn
 * chạy ở chế độ chỉ đọc, tham số hoá, có giới hạn số dòng và thời gian
 * (mục 6.4).
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(
        name = "report_data_query",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"code", "version_no"},
                name = "uq_report_data_query_version"
        )
)
public class ReportDataQuery {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, length = 64)
    private String code;

    @Column(name = "version_no", nullable = false)
    @Builder.Default
    private Integer versionNo = 1;

    @Column(nullable = false)
    private String name;

    private String description;

    /**
     * Câu lệnh SELECT tham số hoá. Tham số dùng cú pháp {@code :ten_tham_so};
     * kỳ báo cáo luôn có sẵn {@code :period_start} và {@code :period_end}.
     */
    @Column(nullable = false, columnDefinition = "text")
    private String statement;

    /** Danh sách cột trả về, phân tách bằng dấu phẩy, dùng để map placeholder. */
    @Column(columnDefinition = "text")
    private String outputColumns;

    /** Nhãn bảo mật của dữ liệu truy vấn trả về. */
    @Column(length = 64)
    private String securityLabelCode;

    @Builder.Default
    private Integer securityLevel = 0;

    /** Trần số dòng cho một lần chạy. */
    @Builder.Default
    private Integer maxRows = 5000;

    /** DRAFT | APPROVED | RETIRED */
    @Column(nullable = false, length = 16)
    @Builder.Default
    private String status = "DRAFT";

    @Column(nullable = false, length = 128)
    private String createdBy;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(length = 128)
    private String approvedBy;

    private LocalDateTime approvedAt;
}
