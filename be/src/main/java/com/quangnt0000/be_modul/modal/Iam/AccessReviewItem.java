package com.quangnt0000.be_modul.modal.Iam;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Một dòng cần quyết định trong đợt rà soát quyền. */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(
        name = "iam_access_review_item",
        indexes = @Index(name = "ix_review_item_review", columnList = "reviewId")
)
public class AccessReviewItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false)
    private String reviewId;

    @Column(nullable = false)
    private String userId;

    private String username;

    private String orgCode;

    @Column(nullable = false)
    private String roleCode;

    private Integer clearanceLevel;

    /** PENDING | KEEP | REVOKE */
    @Column(nullable = false, length = 16)
    @Builder.Default
    private String decision = "PENDING";

    private String decidedBy;

    private LocalDateTime decidedAt;

    @Column(columnDefinition = "text")
    private String reason;
}
