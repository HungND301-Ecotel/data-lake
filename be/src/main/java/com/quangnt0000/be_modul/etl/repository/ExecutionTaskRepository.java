package com.quangnt0000.be_modul.etl.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.quangnt0000.be_modul.etl.entity.ExecutionTaskEntity;

public interface ExecutionTaskRepository extends JpaRepository<ExecutionTaskEntity, Long>{
    Optional<ExecutionTaskEntity> findByExecution_IdAndPipelineTask_Id(Long executionId, Long configId);
    long countByExecution_IdAndStatus(Long executionId, String status);
    boolean existsByPipelineTask_Id(Long id);

    List<ExecutionTaskEntity> findByExecution_IdAndStatus(Long executionId, String status);
}
