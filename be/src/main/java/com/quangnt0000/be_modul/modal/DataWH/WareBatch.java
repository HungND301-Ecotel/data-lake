package com.quangnt0000.be_modul.modal.DataWH;

import com.quangnt0000.be_modul.enums.WareBatchEnum;
import com.quangnt0000.be_modul.enums.WareBatchTargetEnum;
import com.quangnt0000.be_modul.modal.DataLake.Employee;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)
public class WareBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String code;

    private String name;
    private String description;
    private String s3FileKey;
    
    private Integer reportYear;
    private Integer reportMonth;
    private Integer reportDay;

    @ManyToOne
    @JoinColumn(name = "wareTemplateId")
    private WareTemplate wareTemplate;

    @ManyToOne
    @JoinColumn(name = "employeeId")
    private Employee employee;

    @OneToMany(mappedBy = "wareBatch")
    private List<WareDataRow> wareDataRows;

    @Column(name = "syncTarget", nullable = true)
    @Enumerated(EnumType.STRING)
    private WareBatchTargetEnum syncTarget;

    // Trạng thái phê duyệt
    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(nullable = true)
    private WareBatchEnum status = WareBatchEnum.Cho_Phe_Duyet;
    //base
    @Builder.Default
    private Boolean deleted = false;
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
