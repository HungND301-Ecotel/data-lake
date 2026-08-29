package com.quangnt0000.be_modul.etl.entity;

import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "etl_pipelines")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EtlPipelineEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "pipeline_name")
    private String pipelineName; // "ETL Pipeline 1"

    @Column(name = "description")
    private String description;  // "Sản xuất → Staging"

    @Column(name = "target_type")
    private String targetType;   // "STAGING" / "TKV_REPORT"

    @Column(name = "nifi_flow_id")
    private String nifiFlowId;   // UUID Process Group trong NiFi

    @Column(name = "order_index")
    private Integer orderIndex;
    
    @Column(name = "is_active")
    private Boolean isActive = true;

    @OneToMany(mappedBy = "pipeline", fetch = FetchType.LAZY)
    private List<PipelineTaskConfigEntity> tasks;

    @OneToMany(mappedBy = "pipeline")
    private List<PipelineExecutionEntity> executions;
    
}
