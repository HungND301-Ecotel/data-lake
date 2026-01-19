package com.quangnt0000.be_modul.modal.DataWH;

import com.quangnt0000.be_modul.modal.DataLake.Employee;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
@Table(
        name = "ware_approval_config",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"ware_template_id", "approval_order"})
        }
)
public class WareTemplateApprovalConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne()
    @JoinColumn(name = "ware_template_id", nullable = false)
    private WareTemplate wareTemplate;

    @ManyToOne()
    @JoinColumn(name = "approver_id", nullable = false)
    private Employee approver;

    @Column(name = "approval_order", nullable = false)
    private Integer approvalOrder; 

    @Builder.Default
    @Column(nullable = false)
    private Boolean isActive = true;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
