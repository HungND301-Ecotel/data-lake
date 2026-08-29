package com.quangnt0000.be_modul.etl.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pipeline_task_config", uniqueConstraints = @UniqueConstraint(name = "uk_pipeline_task_source", columnNames = {
        "pipeline_id", "target_table", "source_key" }))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipelineTaskConfigEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_name", nullable = false, length = 200)
    private String taskName;

    @Column(name = "target_db_name", length = 100)
    private String targetDbName;

    @Column(name = "target_table", length = 100)
    private String targetTable;

    @Column(name = "params_schema", columnDefinition = "TEXT")
    private String paramsSchema;

    @Column(name = "source_schema", length = 100)
    private String sourceSchema;

    @Column(name = "target_schema", length = 100)
    private String targetSchema;

    @Column(name = "source_key")
    private String sourceKey;

    @Builder.Default
    @Column(name = "last_sync_value", length = 100)
    private LocalDateTime lastSyncValue = LocalDateTime.of(1900, 1, 1, 0, 0);

    @Column(name = "sync_param_type", length = 20)
    private Integer syncParamType;

    @Column(name = "sync_column", length = 100)
    private String syncColumn; //tên cột trong bảng nguồn dùng để incremental

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    // Tắt/bật config mà không cần xóa

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pipeline_id", nullable = false)
    private EtlPipelineEntity pipeline;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "data_source_id", nullable = false)
    private DataSourceConnectionEntity dataSource;

}
