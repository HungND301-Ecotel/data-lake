package com.quangnt0000.be_modul.modal.DataLake;

import com.quangnt0000.be_modul.modal.Iam.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String username;
    @Column(nullable = false)
    private String password;

    /**
     * Vai trò hiển thị dạng chuỗi, giữ lại để tương thích với dữ liệu và giao
     * diện hiện có. Nguồn sự thật cho phân quyền là {@link #roles}; khi tập này
     * rỗng, hệ thống suy ra vai trò từ chuỗi bên dưới.
     */
    private String role;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employeeId", nullable = false, unique = true)
    private Employee employee;

    @Builder.Default
    private Boolean status = true;

    // ------------------------------------------------------------------
    // M01 - Identity & Access Management
    // ------------------------------------------------------------------

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "iam_user_role",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    @Builder.Default
    private Set<Role> roles = new HashSet<>();

    /** Mã đơn vị sở hữu, phát vào claim {@code org_id} của JWT. */
    @Column(length = 64)
    private String orgCode;

    /**
     * Mức độ mật tối đa người dùng được tiếp cận (mục 9.1). Do Security Officer
     * đặt; clearance hiệu lực là min(giá trị này, mức cao nhất của các vai trò).
     */
    @Builder.Default
    private Integer clearanceLevel = 0;

    /** MFA bắt buộc cho miền B/C - mục 9.1 và UC01.02. */
    @Builder.Default
    private Boolean mfaEnabled = false;

    /** Khoá TOTP dạng base32. Không bao giờ trả ra ngoài sau khi đã kích hoạt. */
    @Column(length = 64)
    private String mfaSecret;

    private LocalDateTime mfaEnrolledAt;

    /**
     * Tăng lên mỗi lần thu hồi quyền truy cập. Token mang phiên bản cũ hơn bị
     * từ chối ngay, nên revoke có hiệu lực tức thì (UC01.05).
     */
    @Builder.Default
    private Integer tokenVersion = 0;

    @Builder.Default
    private Integer failedLoginAttempts = 0;

    /** Khoá tạm sau nhiều lần đăng nhập sai. */
    private LocalDateTime lockedUntil;

    private LocalDateTime lastLoginAt;

    private LocalDateTime revokedAt;

    private String revokedBy;
}
