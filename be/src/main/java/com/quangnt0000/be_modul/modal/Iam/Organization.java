package com.quangnt0000.be_modul.modal.Iam;

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
 * Đơn vị sở hữu dữ liệu - tài liệu mục 7.1 (nhóm Governance).
 *
 * <p>{@code code} là khoá nghiệp vụ được phát vào JWT dưới claim {@code org_id};
 * worker (ai_worker_lake_house) tra cứu tổ chức theo id hoặc code nên hai hệ
 * thống chỉ cần thống nhất bộ mã, không cần dùng chung bảng.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "iam_organization")
public class Organization {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false, length = 64)
    private String code;

    @Column(nullable = false)
    private String name;

    private String parentId;

    private String description;

    @Builder.Default
    private Boolean active = true;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
