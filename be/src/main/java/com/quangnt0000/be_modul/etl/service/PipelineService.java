package com.quangnt0000.be_modul.etl.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeFormatterBuilder;
import java.time.temporal.ChronoField;
import java.util.List;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import com.quangnt0000.be_modul.etl.dto.DataSourceConfig;
import com.quangnt0000.be_modul.etl.dto.NotifySourcePayload;
import com.quangnt0000.be_modul.etl.dto.PipelineTaskConfig;
import com.quangnt0000.be_modul.etl.entity.EtlPipelineEntity;
import com.quangnt0000.be_modul.etl.entity.ExecutionTaskEntity;
import com.quangnt0000.be_modul.etl.entity.PipelineExecutionEntity;
import com.quangnt0000.be_modul.etl.entity.PipelineTaskConfigEntity;
import com.quangnt0000.be_modul.etl.enums.PipelineStatusEnum;
import com.quangnt0000.be_modul.etl.event.PipelineTriggeredEvent;
import com.quangnt0000.be_modul.etl.repository.EtlPipelineRepository;
import com.quangnt0000.be_modul.etl.repository.ExecutionTaskRepository;
import com.quangnt0000.be_modul.etl.repository.PipelineExecutionRepository;
import com.quangnt0000.be_modul.etl.repository.PipelineTaskConfigRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class PipelineService {
        private final PipelineExecutionRepository executionRepository;
        private final PipelineTaskConfigRepository taskConfigRepository;
        private final PipelineSqlProvider pipelineSqlProvider;
        private final EtlPipelineRepository pipelineRepository;
        private final ExecutionTaskRepository executionTaskRepository;
        private final ApplicationEventPublisher eventPublisher;

        @Transactional
        public void triggerPipeline(Long pipelineId) {
                EtlPipelineEntity pipeline = pipelineRepository.findByIdForUpdate(pipelineId)
                                .orElseThrow(() -> new EntityNotFoundException("Pipeline not found: " + pipelineId));

                boolean isRunning = executionRepository
                                .findTopByPipeline_IdOrderByTriggeredAtDesc(pipelineId)
                                .map(e -> PipelineStatusEnum.RUNNING.name().equals(e.getStatus()))
                                .orElse(false);

                if (isRunning) {
                        log.warn("Pipeline {} đang chạy, bỏ qua lệnh trigger trùng", pipelineId);
                        throw new IllegalStateException(
                                        "Pipeline " + pipelineId + " đang chạy, không thể trigger trùng");
                }

                List<PipelineTaskConfigEntity> configs = taskConfigRepository
                                .findByPipeline_IdAndIsActiveTrue(pipelineId);
                if (configs.isEmpty()) {
                        throw new IllegalStateException(
                                        "Không có config active cho pipeline " + pipelineId);
                }

                PipelineExecutionEntity executionEntity = PipelineExecutionEntity.builder()
                                .pipeline(pipeline)
                                .status(PipelineStatusEnum.RUNNING.name())
                                .expectedSources(configs.size())
                                .receivedSources(0)
                                .triggeredAt(LocalDateTime.now())
                                .build();
                executionRepository.save(executionEntity);

                List<ExecutionTaskEntity> executionTasks = configs.stream()
                                .map(cfg -> ExecutionTaskEntity.builder()
                                                .execution(executionEntity)
                                                .status(PipelineStatusEnum.PENDING.name())
                                                .pipelineTask(cfg)
                                                .build())
                                .toList();
                executionTaskRepository.saveAll(executionTasks);

                // Long executionId = executionEntity.getId();

                // nifiService.triggerWithExecutionId(executionId)
                //                 .doOnError(err -> {
                //                         log.error("Lỗi trigger NiFi executionId={}: {}",
                //                                         executionId, err.getMessage());
                //                         markExecutionError(executionId, err.getMessage());
                //                 })
                //                 .subscribe();
                eventPublisher.publishEvent(new PipelineTriggeredEvent(executionEntity.getId()));
        }

        public void markExecutionError(Long executionId, String message) {
                executionRepository.findById(executionId).ifPresent(e -> {
                        e.setStatus(PipelineStatusEnum.ERROR.name());
                        e.setCompletedAt(LocalDateTime.now());
                        executionRepository.save(e);
                        log.error("Execution {} chuyển ERROR: {}", executionId, message);
                });
        }

        public PipelineTaskConfig buildTaskConfig(Long executionId) {
                // PipelineExecutionEntity execution = executionRepository.findById(executionId)
                //                 .orElseThrow(() -> new EntityNotFoundException("Execution not found: " + executionId));

                List<ExecutionTaskEntity> pendingTasks = executionTaskRepository
                                .findByExecution_IdAndStatus(executionId, PipelineStatusEnum.PENDING.name());
 
                if (pendingTasks.isEmpty()) {
                        throw new EntityNotFoundException(
                                        "Không có task PENDING nào cho execution " + executionId);
                }

                List<DataSourceConfig> sources = pendingTasks.stream()
                                .map(ExecutionTaskEntity::getPipelineTask)
                                .map(cfg -> DataSourceConfig.builder()
                                                .configId(cfg.getId())
                                                .sourceDbName(cfg.getDataSource().getDatabaseName())
                                                .sourceKey(cfg.getSourceKey())
                                                .host(cfg.getDataSource().getHost())
                                                .port(cfg.getDataSource().getPort())
                                                .sourceSql(pipelineSqlProvider.build(cfg))
                                                .targetDbName(cfg.getTargetDbName())
                                                .targetTable(cfg.getTargetTable())
                                                .targetSchema(cfg.getTargetSchema())
                                                .lastSyncValue(cfg.getLastSyncValue() != null ? cfg.getLastSyncValue()
                                                                : LocalDateTime.of(1900, 1, 1, 0, 0))
                                                .syncParamType(cfg.getSyncParamType())
                                                .syncColumn(cfg.getSyncColumn())
                                                .databaseType(cfg.getDataSource().getDatabaseType().name())
                                                .build())
                                .toList();

                return PipelineTaskConfig.builder()
                                .sources(sources)
                                .build();
        }

        @Transactional
        public void handleNotify(Long executionId, NotifySourcePayload payload) {
                try {
                        PipelineExecutionEntity execution = executionRepository.findByIdForUpdate(executionId)
                                        .orElseThrow(() -> new EntityNotFoundException(
                                                        "Execution not found: " + executionId));

                        if (List.of("SUCCESS", "ERROR").contains(execution.getStatus())) {
                                log.warn("Execution {} đã kết thúc, bỏ qua notify từ configId={}", executionId,
                                                payload.getConfigId());
                                return;
                        }

                        ExecutionTaskEntity execTask = executionTaskRepository
                                        .findByExecution_IdAndPipelineTask_Id(executionId, payload.getConfigId())
                                        .orElseThrow(() -> new EntityNotFoundException(
                                                        "Không tìm thấy execution task cho configId: "
                                                                        + payload.getConfigId()));

                        if (!PipelineStatusEnum.PENDING.name().equals(execTask.getStatus())) {
                                log.warn("ConfigId {} đã xử lý trước đó, bỏ qua", payload.getConfigId());
                                return;
                        }

                        if (PipelineStatusEnum.ERROR.name().equals(payload.getStatus())) {
                                execTask.setStatus(PipelineStatusEnum.ERROR.name());
                                execTask.setCompletedAt(LocalDateTime.now());
                                executionTaskRepository.save(execTask);
                                log.warn("Lỗi ở config {}", payload.getConfigId());
                                finalizeExecutionIfDone(execution);
                                return;
                        }

                        execTask.setStatus(PipelineStatusEnum.SUCCESS.name());
                        execTask.setRowCount(payload.getRowCount());
                        execTask.setCompletedAt(LocalDateTime.now());
                        executionTaskRepository.save(execTask);

                        PipelineTaskConfigEntity cfg = execTask.getPipelineTask();
                        if (cfg.getSyncColumn() != null && payload.getRowCount() != null && payload.getRowCount() > 0
                                        && payload.getMaxSyncValue() != null && !payload.getMaxSyncValue().isBlank()) {
                                DateTimeFormatter formatter = new DateTimeFormatterBuilder()
                                                .appendPattern("yyyy-MM-dd HH:mm:ss")
                                                .optionalStart()
                                                .appendFraction(ChronoField.MILLI_OF_SECOND, 0, 9, true)
                                                .optionalEnd()
                                                .toFormatter();
                                LocalDateTime maxSync = LocalDateTime.parse(payload.getMaxSyncValue(), formatter);
                                cfg.setLastSyncValue(maxSync);
                                taskConfigRepository.save(cfg);
                        }

                        finalizeExecutionIfDone(execution);
                } catch (Exception e) {
                        log.error("Notify failed", e);
                        throw e;
                }
        }

        private void finalizeExecutionIfDone(PipelineExecutionEntity execution) {
                Long executionId = execution.getId();
                long successCount = executionTaskRepository.countByExecution_IdAndStatus(executionId,
                                PipelineStatusEnum.SUCCESS.name());
                long errorCount = executionTaskRepository.countByExecution_IdAndStatus(executionId,
                                PipelineStatusEnum.ERROR.name());
                long processedCount = successCount + errorCount;
 
                execution.setReceivedSources((int) successCount);
 
                if (processedCount == execution.getExpectedSources()) {
                        execution.setStatus(PipelineStatusEnum.SUCCESS.name());
                        execution.setCompletedAt(LocalDateTime.now());
                        if (errorCount > 0) {
                                execution.setStatus(PipelineStatusEnum.PARTIAL_SUCCESS.name());
                                log.warn("Execution {} hoàn tất với {}/{} nguồn lỗi", executionId, errorCount,
                                                execution.getExpectedSources());
                        } else {
                                log.info("Execution {} hoàn tất, đã nhận đủ {} nguồn thành công", executionId,
                                                execution.getExpectedSources());
                        }
                }
                executionRepository.save(execution);
        }
 
        /*
         * retry chỉ những task ERROR của 1 execution đã hoàn tất, thay vì
         * phải trigger lại toàn bộ pipeline (kéo lại cả những nguồn đã thành
         * công, lãng phí và có thể trùng lặp dữ liệu nếu nguồn không hỗ trợ
         * upsert idempotent).
         *
         */
        @Transactional
        public void retryFailedTasks(Long executionId) {
                PipelineExecutionEntity execution = executionRepository.findByIdForUpdate(executionId)
                                .orElseThrow(() -> new EntityNotFoundException("Execution not found: " + executionId));
 
                if (PipelineStatusEnum.RUNNING.name().equals(execution.getStatus())) {
                        throw new IllegalStateException(
                                        "Execution " + executionId + " đang chạy, không thể retry lúc này");
                }
 
                List<ExecutionTaskEntity> failedTasks = executionTaskRepository
                                .findByExecution_IdAndStatus(executionId, PipelineStatusEnum.ERROR.name());
 
                if (failedTasks.isEmpty()) {
                        throw new IllegalStateException(
                                        "Execution " + executionId + " không có task nào ở trạng thái ERROR để retry");
                }
 
                List<Long> retryConfigIds = failedTasks.stream()
                                .map(t -> t.getPipelineTask().getId())
                                .toList();
 
                failedTasks.forEach(t -> {
                        t.setStatus(PipelineStatusEnum.PENDING.name());
                        t.setErrorMessage(null);
                        t.setCompletedAt(null);
                });
                executionTaskRepository.saveAll(failedTasks);
 
                execution.setStatus(PipelineStatusEnum.RUNNING.name());
                execution.setCompletedAt(null);
                executionRepository.save(execution);
 
                log.info("Retry {} task lỗi của execution {}: configIds={}",
                                retryConfigIds.size(), executionId, retryConfigIds);
                eventPublisher.publishEvent(new PipelineTriggeredEvent(executionId));
        }
}
