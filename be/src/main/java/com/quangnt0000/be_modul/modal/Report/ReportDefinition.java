package com.quangnt0000.be_modul.modal.Report;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Định nghĩa một báo cáo có kiểm soát - tài liệu mục 5.3 (M10).
 *
 * <p>Đây là thực thể ổn định qua thời gian; nội dung tệp mẫu nằm ở
 * {@link ReportTemplateVersion} vì mỗi lần sửa mẫu phải tạo phiên bản mới thay
 * vì ghi đè, để một báo cáo đã phát hành luôn tái lập được.
 *
 * <p>Tách khỏi thực thể {@code ReportTemplate} cũ (bảng {@code report_template})
 * để luồng báo cáo hiện có không bị ảnh hưởng trong lúc chuyển đổi.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "report_definition")
public class ReportDefinition {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false, length = 64)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    /** Đơn vị chịu trách nhiệm nội dung báo cáo. */
    @Column(length = 64)
    private String ownerOrgCode;

    /** Người phê duyệt nghiệp vụ theo phụ lục A (Data Owner). */
    @Column(length = 128)
    private String ownerUserId;

    /**
     * Mã nhãn bảo mật của báo cáo, dùng chung bộ mã với worker. Quyết định
     * watermark khi xuất và mức clearance tối thiểu để xem.
     */
    @Column(length = 64)
    private String securityLabelCode;

    /** Mức độ mật tương ứng, lưu kèm để so sánh nhanh mà không phải tra cứu. */
    @Builder.Default
    private Integer securityLevel = 0;

    /** DOCX hoặc XLSX. */
    @Column(length = 16)
    private String templateFormat;

    /** Kỳ báo cáo mặc định: MONTH, QUARTER, YEAR, ADHOC. */
    @Column(length = 16)
    @Builder.Default
    private String periodType = "MONTH";

    @Builder.Default
    private Boolean active = true;

    @Column(nullable = false, length = 128)
    private String createdBy;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
