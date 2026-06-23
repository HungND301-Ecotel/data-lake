package com.quangnt0000.be_modul.modal.DataLake;

import com.quangnt0000.be_modul.modal.DataWH.WareCategory;
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
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String code;
    private String name;
    private String description;
    private String parentId;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Builder.Default
    private Boolean deleted = false;

    @ManyToMany(mappedBy = "departments")
    private List<Employee> employees;

    @OneToMany(mappedBy = "department")
    private List<WareCategory> wareCategories;

    @OneToMany(mappedBy = "department")
    private List<ReportCategory> reportCategories;
}
