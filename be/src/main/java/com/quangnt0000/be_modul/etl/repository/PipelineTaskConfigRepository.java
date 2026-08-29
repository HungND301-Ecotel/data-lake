package com.quangnt0000.be_modul.etl.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.quangnt0000.be_modul.etl.entity.PipelineTaskConfigEntity;

public interface PipelineTaskConfigRepository extends JpaRepository<PipelineTaskConfigEntity, Long> {
    List<PipelineTaskConfigEntity> findByPipeline_IdAndIsActiveTrue(Long pipelineId);

    boolean existsByPipeline_IdAndTargetTableAndSourceKey(Long pipelineId, String targetTable, String sourceKey);

    boolean existsByPipeline_IdAndTargetTableAndSourceKeyAndIdNot(
            Long pipelineId, String targetTable, String sourceKey, Long excludeId);

    List<PipelineTaskConfigEntity> findByPipeline_Id(Long pipelineId);

    List<PipelineTaskConfigEntity> findByPipeline_IdAndTargetTable(Long pipelineId, String targetTable);
}
