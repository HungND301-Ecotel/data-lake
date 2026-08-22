package com.quangnt0000.be_modul.modal.Report;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Một lần sinh báo cáo cho một kỳ - tài liệu mục 5.3.
 *
 * <p>Vòng đời: DRAFT (đã chốt số liệu) → PENDING_APPROVAL → APPROVED → EXPORTED,
 * hoặc REJECTED. Số liệu được khoá ngay khi tạo run, nên bản xem trước, bản phê
 * duyệt và bản xuất ra luôn là cùng một bộ số.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(name = "report_run")
public class ReportRun {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "definition_id", nullable = false)
    private String definitionId;

    /** Phiên bản mẫu đã dùng; khoá lại để bản render tái lập được. */
    @Column(name = "template_version_id", nullable = false)
    private String templateVersionId;

    private String title;

    private LocalDate periodStart;

    private LocalDate periodEnd;

    /** DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | EXPORTED */
    @Column(nullable = false, length = 24)
    @Builder.Default
    private String status = "DRAFT";

    /** Ảnh chụp số liệu; xem {@link ReportFact}. */
    @Column(name = "snapshot_id", nullable = false, length = 36)
    private String snapshotId;

    /** SHA-256 của toàn bộ fact đã chốt, dùng để chứng minh không bị sửa. */
    @Column(length = 64)
    private String snapshotChecksum;

    private LocalDateTime snapshotAt;

    @Column(length = 64)
    private String securityLabelCode;

    @Builder.Default
    private Integer securityLevel = 0;

    /** Mô hình và phiên bản prompt đã dùng cho phần nhận xét AI. */
    @Column(length = 128)
    private String aiModelId;

    @Column(length = 64)
    private String aiModelVersion;

    @Column(length = 64)
    private String aiPromptVersion;

    @Column(columnDefinition = "text")
    private String warnings;

    @Column(nullable = false, length = 128)
    private String createdBy;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(length = 128)
    private String submittedBy;

    private LocalDateTime submittedAt;

    @Column(length = 128)
    private String approvedBy;

    private LocalDateTime approvedAt;

    @Column(columnDefinition = "text")
    private String decisionNote;

    /** Khoá tệp kết quả trong object storage sau khi xuất bản. */
    private String artifactFileKey;

    @Column(length = 64)
    private String artifactSha256;

    private LocalDateTime exportedAt;
}
