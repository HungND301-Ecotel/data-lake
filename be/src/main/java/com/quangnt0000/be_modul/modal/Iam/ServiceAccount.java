package com.quangnt0000.be_modul.modal.Iam;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * Danh tính dịch vụ cho tích hợp máy-máy (UC01.07).
 *
 * <p>Chỉ lưu hash của client secret; secret gốc hiển thị đúng một lần lúc tạo
 * hoặc lúc xoay vòng. Token cấp qua luồng client_credentials của mục 5.4.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "iam_service_account")
public class ServiceAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false, length = 128)
    private String clientId;

    @Column(nullable = false)
    private String clientSecretHash;

    @Column(nullable = false)
    private String name;

    private String description;

    /** Đơn vị mà service account hành động thay mặt. */
    private String orgCode;

    @Builder.Default
    private Integer clearanceLevel = 0;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "iam_service_account_role",
            joinColumns = @JoinColumn(name = "service_account_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    @Builder.Default
    private Boolean active = true;

    /** Bắt buộc có hạn để tránh credential sống mãi (mục 9.2 - least privilege). */
    private LocalDateTime expiresAt;

    private LocalDateTime lastUsedAt;

    private String createdBy;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
