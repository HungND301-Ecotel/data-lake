package com.quangnt0000.be_modul.etl.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import com.quangnt0000.be_modul.etl.entity.PipelineExecutionEntity;

import feign.Param;
import jakarta.persistence.LockModeType;

public interface PipelineExecutionRepository extends JpaRepository<PipelineExecutionEntity, Long> {
    Optional<PipelineExecutionEntity> findTopByPipeline_IdOrderByTriggeredAtDesc(Long pipelineId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM PipelineExecutionEntity e WHERE e.id = :id")
    Optional<PipelineExecutionEntity> findByIdForUpdate(@Param("id") Long id);

    List<PipelineExecutionEntity> findByStatusAndTriggeredAtBefore(String status, LocalDateTime cutoff);
}
