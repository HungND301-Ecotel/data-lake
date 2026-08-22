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
import java.util.HashSet;
import java.util.Set;

/**
 * Vai trò theo ma trận phụ lục A của tài liệu giải pháp.
 *
 * <p>Vai trò hệ thống ({@code systemRole = true}) do nền tảng định nghĩa và
 * không được xoá; quản trị viên chỉ được tạo thêm vai trò dẫn xuất.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "iam_role")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false, length = 64)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    /**
     * Mức độ mật tối đa vai trò này được phép chạm tới (miền A/B/C, mục 9.1).
     * Clearance hiệu lực của người dùng là giá trị lớn nhất trong các vai trò,
     * nhưng không vượt quá {@code User.clearanceLevel} do Security Officer đặt.
     */
    @Builder.Default
    private Integer maxClearanceLevel = 0;

    /** Vai trò được đọc dữ liệu ngoài đơn vị của mình. */
    @Builder.Default
    private Boolean crossOrg = false;

    @Builder.Default
    private Boolean systemRole = false;

    @Builder.Default
    private Boolean active = true;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "iam_role_permission",
            joinColumns = @JoinColumn(name = "role_id"),
            inverseJoinColumns = @JoinColumn(name = "permission_id")
    )
    @Builder.Default
    private Set<Permission> permissions = new HashSet<>();

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
