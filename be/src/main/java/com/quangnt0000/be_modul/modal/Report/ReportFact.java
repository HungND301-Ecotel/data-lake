package com.quangnt0000.be_modul.modal.Report;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Một số liệu đã chốt trong fact snapshot - tài liệu mục 5.3 và AC-05.
 *
 * <p>Đây là thứ khiến báo cáo tái lập được: giá trị được lưu kèm truy vấn nào,
 * phiên bản nào, dòng nào và chạy lúc nào. Nhờ vậy có thể trả lời "con số này ở
 * đâu ra" nhiều tháng sau, kể cả khi dữ liệu nguồn đã thay đổi.
 *
 * <p>Fact chỉ được ghi một lần khi tạo run và không bao giờ sửa.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(
        name = "report_fact",
        indexes = {
                @Index(name = "ix_report_fact_snapshot", columnList = "snapshot_id"),
                @Index(name = "ix_report_fact_run", columnList = "run_id")
        }
)
public class ReportFact {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "snapshot_id", nullable = false, length = 36)
    private String snapshotId;

    @Column(name = "run_id", nullable = false)
    private String runId;

    /** Mã fact dùng trong lời dẫn AI, ví dụ {@code F1}. */
    @Column(nullable = false, length = 32)
    private String code;

    /** Tên placeholder mà fact này phục vụ. */
    @Column(nullable = false, length = 191)
    private String placeholderName;

    private String label;

    /**
     * SCALAR cho một con số; TABLE cho cả bảng, khi đó {@link #rawValue} chứa
     * JSON gồm cột và các dòng.
     */
    @Column(nullable = false, length = 16)
    @Builder.Default
    private String factType = "SCALAR";

    /** Giá trị đã định dạng, đúng như sẽ xuất hiện trong báo cáo. */
    @Column(columnDefinition = "text")
    private String value;

    /** Giá trị thô trước khi định dạng, giữ để kiểm tra lại khi cần. */
    @Column(columnDefinition = "text")
    private String rawValue;

    private String unit;

    // ---- nguồn gốc (fact-to-source) --------------------------------------

    @Column(name = "data_query_id", length = 36)
    private String dataQueryId;

    @Column(length = 64)
    private String dataQueryCode;

    private Integer dataQueryVersion;

    @Column(length = 128)
    private String sourceColumn;

    private Integer sourceRowIndex;

    @Column(nullable = false)
    private LocalDateTime executedAt;

    /** Số dòng truy vấn trả về tại thời điểm chốt, để đối chiếu về sau. */
    private Integer sourceRowCount;
}
