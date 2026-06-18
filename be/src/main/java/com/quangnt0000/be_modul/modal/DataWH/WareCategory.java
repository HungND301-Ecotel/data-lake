package com.quangnt0000.be_modul.modal.DataWH;

import com.quangnt0000.be_modul.enums.ReportType;
import com.quangnt0000.be_modul.modal.DataLake.Department;
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

public class WareCategory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String code;

    private String name;
    private String description;

    @OneToMany(mappedBy = "wareCategory")
    private List<WareTemplate> wareTemplates;

    @Column(name = "reportType", nullable = true)
    @Enumerated(EnumType.STRING)
    private ReportType reportType;

    @ManyToOne
    @JoinColumn(name = "departmentId")
    private Department department;

    //base
    @Builder.Default
    private Boolean deleted = false;
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;
}
