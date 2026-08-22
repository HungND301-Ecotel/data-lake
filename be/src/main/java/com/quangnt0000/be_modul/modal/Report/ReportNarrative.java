package com.quangnt0000.be_modul.modal.Report;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Phần nhận xét do AI soạn cho một mục {@code {{ai.*}}} - UC10.06.
 *
 * <p>Giữ liên kết fact-to-source: {@link #factCodes} ghi đúng những số liệu đã
 * chốt mà đoạn văn này dựa vào, và mô hình cùng phiên bản prompt được lưu lại
 * để tái lập. Người dùng được phép sửa tay trước khi phê duyệt; khi đó
 * {@link #editedBy} có giá trị và bản gốc của mô hình vẫn được giữ ở
 * {@link #generatedText}.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(
        name = "report_narrative",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"run_id", "placeholder_name"},
                name = "uq_report_narrative_section"
        )
)
public class ReportNarrative {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "run_id", nullable = false)
    private String runId;

    @Column(name = "placeholder_name", nullable = false, length = 191)
    private String placeholderName;

    /** Bản do mô hình sinh ra, không bao giờ bị ghi đè. */
    @Column(columnDefinition = "text")
    private String generatedText;

    /** Bản dùng để render; bằng generatedText cho tới khi có người sửa. */
    @Column(columnDefinition = "text")
    private String finalText;

    /** Mã fact mà đoạn văn dựa vào, phân tách bằng dấu phẩy. */
    @Column(columnDefinition = "text")
    private String factCodes;

    @Column(length = 128)
    private String modelId;

    @Column(length = 64)
    private String modelVersion;

    @Column(length = 64)
    private String promptCode;

    /** true khi worker chặn vì mô hình bịa số liệu hoặc vi phạm chính sách. */
    @Builder.Default
    private Boolean blocked = false;

    @Column(columnDefinition = "text")
    private String warnings;

    @Builder.Default
    private LocalDateTime generatedAt = LocalDateTime.now();

    @Column(length = 128)
    private String editedBy;

    private LocalDateTime editedAt;
}
