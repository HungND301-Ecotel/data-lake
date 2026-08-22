package com.quangnt0000.be_modul.modal.Iam;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Đợt rà soát quyền (UC01.06).
 *
 * <p>Khi mở đợt, hệ thống chụp lại toàn bộ gán vai trò đang hiệu lực thành các
 * {@link AccessReviewItem}. Người rà soát quyết định giữ hay thu hồi từng mục;
 * quyết định THU HỒI được áp dụng ngay và ghi audit.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(name = "iam_access_review")
public class AccessReview {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String name;

    private String scopeOrgCode;

    /** OPEN | COMPLETED | CANCELLED */
    @Column(nullable = false, length = 16)
    @Builder.Default
    private String status = "OPEN";

    @Column(nullable = false)
    private String createdBy;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime dueAt;

    private LocalDateTime completedAt;

    private String completedBy;
}
