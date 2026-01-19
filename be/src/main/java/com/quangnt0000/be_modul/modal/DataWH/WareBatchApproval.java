package com.quangnt0000.be_modul.modal.DataWH;

import com.quangnt0000.be_modul.enums.WareBatchEnum;
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
        name = "ware_batch_approval",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"ware_batch_id", "approval_order"})
        }
)
public class WareBatchApproval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne()
    @JoinColumn(name = "ware_batch_id", nullable = false)
    private WareBatch wareBatch;

    @ManyToOne()
    @JoinColumn(name = "approver_id", nullable = false)
    private Employee approver;

    @Column(name = "approval_order", nullable = false)
    private Integer approvalOrder;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = false)
    private WareBatchEnum status = WareBatchEnum.Cho_Phe_Duyet;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
