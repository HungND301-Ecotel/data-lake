package com.quangnt0000.be_modul.etl.service;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.quangnt0000.be_modul.etl.event.PipelineTriggeredEvent;
import com.quangnt0000.be_modul.service.Nifi.NifiService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class PipelineTriggerEventListener {
    private final NifiService nifiService;
    private final PipelineService pipelineService;
    
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPipelineTriggered(PipelineTriggeredEvent event) {
        Long executionId = event.executionIds();
        nifiService.triggerWithExecutionId(executionId)
                .doOnError(err -> {
                    log.error("Lỗi trigger NiFi executionId={}: {}", executionId, err.getMessage());
                    pipelineService.markExecutionError(executionId, err.getMessage());
                })
                .subscribe();
    }
}
