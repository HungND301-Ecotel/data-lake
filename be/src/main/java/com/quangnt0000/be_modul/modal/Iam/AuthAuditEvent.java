package com.quangnt0000.be_modul.modal.Iam;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Nhật ký kiểm toán cho các sự kiện danh tính - tài liệu mục 9.3.
 *
 * <p>Bảng chỉ ghi thêm. Ứng dụng không được cấp quyền UPDATE/DELETE trên bảng
 * này ở môi trường thật. Không bao giờ ghi mật khẩu, token hay secret vào
 * {@code details}.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(
        name = "iam_auth_audit_event",
        indexes = {
                @Index(name = "ix_auth_audit_occurred", columnList = "occurredAt"),
                @Index(name = "ix_auth_audit_actor", columnList = "actor"),
                @Index(name = "ix_auth_audit_action", columnList = "action")
        }
)
public class AuthAuditEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Builder.Default
    private LocalDateTime occurredAt = LocalDateTime.now();

    /** Id người dùng hoặc clientId của service account. */
    @Column(nullable = false, length = 128)
    private String actor;

    private String actorOrg;

    @Column(nullable = false, length = 64)
    private String action;

    @Column(length = 64)
    private String resourceType;

    @Column(length = 128)
    private String resourceId;

    /** SUCCESS | DENIED | FAILURE */
    @Column(nullable = false, length = 16)
    private String result;

    @Column(length = 64)
    private String policyDecision;

    @Column(length = 64)
    private String sourceIp;

    @Column(length = 64)
    private String correlationId;

    @Column(columnDefinition = "text")
    private String details;
}
