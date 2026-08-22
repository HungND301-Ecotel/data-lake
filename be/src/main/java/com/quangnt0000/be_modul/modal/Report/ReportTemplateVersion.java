package com.quangnt0000.be_modul.modal.Report;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Một phiên bản tệp mẫu - tài liệu mục 5.3.
 *
 * <p>Trạng thái đi theo DRAFT → APPROVED → RETIRED. Chỉ phiên bản APPROVED mới
 * được dùng để sinh báo cáo chính thức, và một phiên bản đã APPROVED không được
 * sửa nữa: mọi thay đổi tạo phiên bản mới.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(
        name = "report_template_version",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"definition_id", "version_no"},
                name = "uq_report_template_version"
        )
)
public class ReportTemplateVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "definition_id", nullable = false)
    private String definitionId;

    @Column(name = "version_no", nullable = false)
    private Integer versionNo;

    /** Khoá tệp mẫu trong object storage. */
    @Column(nullable = false)
    private String fileKey;

    private String originalName;

    /** SHA-256 của tệp mẫu, để chứng minh bản render dùng đúng mẫu nào. */
    @Column(length = 64)
    private String sha256;

    private Long sizeBytes;

    /** DRAFT | APPROVED | RETIRED */
    @Column(nullable = false, length = 16)
    @Builder.Default
    private String status = "DRAFT";

    @Column(columnDefinition = "text")
    private String changeNote;

    @Column(nullable = false, length = 128)
    private String createdBy;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(length = 128)
    private String approvedBy;

    private LocalDateTime approvedAt;

    private LocalDateTime retiredAt;
}
