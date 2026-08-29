package com.quangnt0000.be_modul.etl.entity;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pipeline_executions")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PipelineExecutionEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "status")
    private String status;   // RUNNING, SUCCESS, ERROR

    @Column(name = "expected_sources")
    private Integer expectedSources;

    @Column(name = "received_sources")
    private Integer receivedSources;

    @Column(name = "triggered_at")
    private LocalDateTime triggeredAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    @Version
    @Column(name = "version")
    private Long version;
    
    @ManyToOne
    @JoinColumn(name = "pipeline_id", nullable = false)
    private EtlPipelineEntity pipeline;

    @OneToMany(mappedBy = "execution", fetch = FetchType.LAZY)
    private List<ExecutionTaskEntity> executionTasks;
}
