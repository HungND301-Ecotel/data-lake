package com.quangnt0000.be_modul.modal.Report;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Một chỗ trống tìm được trong tệp mẫu - tài liệu mục 5.3.
 *
 * <p>Cú pháp: {@code {{field}}}, {@code {{table.name}}}, {@code {{chart.name}}},
 * {@code {{ai.section_name}}}. Placeholder do máy quét ra chứ không do người
 * khai báo, nên không thể quên một chỗ trống nào khi kiểm tra tính đầy đủ.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(
        name = "report_placeholder",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"template_version_id", "token"},
                name = "uq_report_placeholder_token"
        )
)
public class ReportPlaceholder {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "template_version_id", nullable = false)
    private String templateVersionId;

    /** Chuỗi nguyên bản trong mẫu, ví dụ {@code {{table.san_luong}}}. */
    @Column(nullable = false, length = 255)
    private String token;

    /** FIELD | TABLE | CHART | AI_SECTION */
    @Column(nullable = false, length = 16)
    private String type;

    /** Phần tên sau tiền tố, ví dụ {@code san_luong}. */
    @Column(nullable = false, length = 191)
    private String name;

    /** Vị trí trong tệp để người thiết kế đối chiếu: đoạn, ô, sheet. */
    @Column(length = 128)
    private String locator;

    @Builder.Default
    private Integer occurrences = 1;
}
