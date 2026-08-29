package com.quangnt0000.be_modul.etl.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.quangnt0000.be_modul.etl.dto.PipelineTaskConfigRequest;
import com.quangnt0000.be_modul.etl.dto.PipelineTaskConfigResponse;
import com.quangnt0000.be_modul.etl.entity.DataSourceConnectionEntity;
import com.quangnt0000.be_modul.etl.entity.EtlPipelineEntity;
import com.quangnt0000.be_modul.etl.entity.PipelineTaskConfigEntity;
import com.quangnt0000.be_modul.etl.repository.DataSourceConnectionRepository;
import com.quangnt0000.be_modul.etl.repository.EtlPipelineRepository;
import com.quangnt0000.be_modul.etl.repository.PipelineTaskConfigRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PipelineTaskConfigService {
    private final PipelineTaskConfigRepository taskConfigRepository;
    private final EtlPipelineRepository pipelineRepository;
    private final DataSourceConnectionRepository dataSourceRepository;

    public List<PipelineTaskConfigResponse> getAllByPipelineId(Long pipelineId) {
        return taskConfigRepository.findByPipeline_Id(pipelineId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    public PipelineTaskConfigResponse getById(Long id) {
        PipelineTaskConfigEntity entity = taskConfigRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Task config not found: " + id));
        return convertToResponse(entity);
    }

    public List<PipelineTaskConfigResponse> getActiveByPipelineId(Long pipelineId) {
        return taskConfigRepository.findByPipeline_IdAndIsActiveTrue(pipelineId)
                .stream()
                .map(this::convertToResponse)
                .toList();
    }

    @Transactional
    public PipelineTaskConfigResponse create(PipelineTaskConfigRequest req) {
        EtlPipelineEntity pipeline = pipelineRepository.findById(req.getPipelineId())
                .orElseThrow(() -> new EntityNotFoundException("Pipeline not found: " + req.getPipelineId()));

        DataSourceConnectionEntity dataSource = dataSourceRepository.findById(req.getDataSourceId())
                .orElseThrow(() -> new EntityNotFoundException("DataSource not found: " + req.getDataSourceId()));

        boolean exists = taskConfigRepository.existsByPipeline_IdAndTargetTableAndSourceKey(
                req.getPipelineId(), req.getTargetTable(), req.getSourceKey());
        if (exists) {
            throw new IllegalStateException(String.format(
                    "Config đã tồn tại cho pipeline=%d, targetTable=%s, sourceKey=%s",
                    req.getPipelineId(), req.getTargetTable(), req.getSourceKey()));
        }

        PipelineTaskConfigEntity entity = PipelineTaskConfigEntity.builder()
                .pipeline(pipeline)
                .sourceSchema(req.getSourceSchema())
                .targetDbName(req.getTargetDbName())
                .targetSchema(req.getTargetSchema())
                .targetTable(req.getTargetTable())
                .dataSource(dataSource)
                .paramsSchema(req.getParamsSchema())
                .syncParamType(req.getSyncParamType())
                .syncColumn(req.getSyncColumn())
                .isActive(true)
                .build();

        return convertToResponse(taskConfigRepository.save(entity));
    }

    @Transactional
    public PipelineTaskConfigResponse update(Long id, PipelineTaskConfigRequest req) {
        PipelineTaskConfigEntity entity = taskConfigRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Task config not found: " + id));

        // Nếu đổi targetTable/sourceKey, check trùng lại (trừ chính nó)
        boolean exists = taskConfigRepository.existsByPipeline_IdAndTargetTableAndSourceKeyAndIdNot(
                req.getPipelineId(), req.getTargetTable(), req.getSourceKey(), id);
        if (exists) {
            throw new IllegalStateException("Config trùng với 1 dòng khác đã tồn tại");
        }

        // Update dataSource nếu thay đổi
        if (req.getDataSourceId() != null) {
            DataSourceConnectionEntity dataSource = dataSourceRepository.findById(req.getDataSourceId())
                    .orElseThrow(() -> new EntityNotFoundException("DataSource not found: " + req.getDataSourceId()));
            entity.setDataSource(dataSource);
        }

        entity.setTaskName(req.getTaskName());
        entity.setParamsSchema(req.getParamsSchema());
        entity.setTargetDbName(req.getTargetDbName());
        entity.setTargetSchema(req.getTargetSchema());
        entity.setTargetTable(req.getTargetTable());
        entity.setSourceKey(req.getSourceKey());
        entity.setSourceSchema(req.getSourceSchema());
        entity.setSyncParamType(req.getSyncParamType());
        entity.setSyncColumn(req.getSyncColumn());

        return convertToResponse(taskConfigRepository.save(entity));
    }

    @Transactional
    public PipelineTaskConfigResponse restore(Long id) {
        PipelineTaskConfigEntity entity = taskConfigRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Task config not found: " + id));
        entity.setIsActive(true);
        return convertToResponse(taskConfigRepository.save(entity));
    }

    @Transactional
    public void delete(Long id) {
        PipelineTaskConfigEntity entity = taskConfigRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Task config not found: " + id));

        entity.setIsActive(false);
        taskConfigRepository.save(entity);
    }

    private PipelineTaskConfigResponse convertToResponse(PipelineTaskConfigEntity entity) {
        return PipelineTaskConfigResponse.builder()
                .id(entity.getId())
                .taskName(entity.getTaskName())
                .targetDbName(entity.getTargetDbName())
                .targetSchema(entity.getTargetSchema())
                .targetTable(entity.getTargetTable())
                .sourceKey(entity.getSourceKey())
                .sourceSchema(entity.getSourceSchema())
                .paramsSchema(entity.getParamsSchema())
                .syncParamType(entity.getSyncParamType())
                .syncColumn(entity.getSyncColumn())
                .lastSyncValue(entity.getLastSyncValue())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .pipelineId(entity.getPipeline().getId())
                .pipelineName(entity.getPipeline().getPipelineName())
                .dataSourceId(entity.getDataSource().getId())
                .dataSourceName(entity.getDataSource().getDatabaseName())
                .dataSourceHost(entity.getDataSource().getHost())
                .dataSourcePort(entity.getDataSource().getPort())
                .build();
    }
}
