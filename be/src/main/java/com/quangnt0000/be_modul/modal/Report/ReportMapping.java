package com.quangnt0000.be_modul.modal.Report;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Ánh xạ một placeholder tới nguồn số liệu hoặc tới một mục AI - UC10.03.
 *
 * <p>Placeholder loại FIELD/TABLE/CHART phải trỏ tới một
 * {@link ReportDataQuery} đã duyệt. Placeholder loại AI_SECTION chỉ mang lời
 * dẫn cho mô hình và danh sách mã fact được phép dùng; bản thân nó không sinh
 * số liệu nào.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(
        name = "report_mapping",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"placeholder_id"},
                name = "uq_report_mapping_placeholder"
        )
)
public class ReportMapping {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "placeholder_id", nullable = false)
    private String placeholderId;

    @Column(name = "template_version_id", nullable = false)
    private String templateVersionId;

    /** Với FIELD/TABLE/CHART: truy vấn cung cấp số liệu. */
    @Column(name = "data_query_id")
    private String dataQueryId;

    /** Với FIELD: cột lấy giá trị. Với TABLE/CHART: bỏ trống để lấy cả bảng. */
    @Column(length = 128)
    private String outputColumn;

    /** Với FIELD: chỉ số dòng cần lấy, mặc định dòng đầu. */
    @Builder.Default
    private Integer rowIndex = 0;

    /** Định dạng hiển thị: NUMBER, NUMBER_0, PERCENT, DATE, TEXT. */
    @Column(length = 32)
    @Builder.Default
    private String format = "TEXT";

    private String unit;

    /** Với AI_SECTION: yêu cầu viết cho mục này. */
    @Column(columnDefinition = "text")
    private String aiInstruction;

    /**
     * Với AI_SECTION: danh sách mã fact mô hình được dùng, phân tách bằng dấu
     * phẩy. Để trống nghĩa là dùng toàn bộ fact của báo cáo.
     */
    @Column(columnDefinition = "text")
    private String aiFactCodes;

    @Column(nullable = false, length = 128)
    private String createdBy;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt;
}
