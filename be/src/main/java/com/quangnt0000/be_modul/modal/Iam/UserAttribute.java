package com.quangnt0000.be_modul.modal.Iam;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Thuộc tính ABAC gắn với người dùng (UC01.04).
 *
 * <p>Policy engine dùng các cặp key/value này để quyết định ngoài vai trò, ví dụ
 * {@code project=DA-01} hay {@code purpose=BAO_CAO}. Thuộc tính được phát vào
 * claim {@code attrs} của JWT.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(
        name = "iam_user_attribute",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "attr_key"})
)
public class UserAttribute {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "attr_key", nullable = false, length = 64)
    private String key;

    @Column(name = "attr_value", nullable = false)
    private String value;

    private String grantedBy;

    @Builder.Default
    private LocalDateTime grantedAt = LocalDateTime.now();

    /** Thuộc tính có hạn; hết hạn thì không còn được đưa vào token. */
    private LocalDateTime expiresAt;
}
