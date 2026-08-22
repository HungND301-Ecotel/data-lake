package com.quangnt0000.be_modul.modal.Iam;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Quyền hạt nhỏ, dùng làm authority trong {@code @PreAuthorize} và phát vào
 * claim {@code perms} của JWT. Danh mục mã theo bảng API nội bộ mục 8.1.
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@Table(name = "iam_permission")
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** Ví dụ: data.upload, pipeline.execute, approval.decide. */
    @Column(unique = true, nullable = false, length = 64)
    private String code;

    @Column(nullable = false)
    private String name;

    /** Nhóm hiển thị trên giao diện quản trị. */
    private String category;

    private String description;
}
