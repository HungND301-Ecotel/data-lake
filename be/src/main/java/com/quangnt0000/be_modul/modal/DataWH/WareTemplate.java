package com.quangnt0000.be_modul.modal.DataWH;

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
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Entity
@EntityListeners(AuditingEntityListener.class)

public class WareTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String code;

    private String name;
    private String description;
    private Integer startRow;

    //ch
    private String tableName;
    private String tableCode;
    private String keyColumns;
    private String scopeFilter;

    //
    @Builder.Default
    private String requestId = UUID.randomUUID().toString();
    @Builder.Default
    private Boolean deleteMissing = true;
    @Builder.Default
    private String changeBy = "supperuser";
    @Builder.Default
    private String dataUploadId = "4400-1000012142";

    @ManyToOne
    @JoinColumn(name = "wareCategoryId")
    private WareCategory wareCategory;

    @OneToMany(mappedBy = "wareTemplate")
    private List<WareBatch> wareBatches;

    @OneToMany(mappedBy = "wareTemplate")
    private List<WareMapping> wareMappings;
    //base
    @Builder.Default
    private Boolean deleted = false;
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @LastModifiedDate
    private LocalDateTime updatedAt;

}
