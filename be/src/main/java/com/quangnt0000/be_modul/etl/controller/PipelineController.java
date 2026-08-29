package com.quangnt0000.be_modul.etl.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.quangnt0000.be_modul.etl.dto.NotifySourcePayload;
import com.quangnt0000.be_modul.etl.service.PipelineService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/pipelines")
@RequiredArgsConstructor
public class PipelineController {
    private final PipelineService pipelineService;

    @PostMapping("/{id}/trigger-sync")
    public ResponseEntity<?> trigger(@PathVariable Long id) {
        pipelineService.triggerPipeline(id);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body("trigged: running");
    }

    @GetMapping("/executions/{executionId}/config")
    public ResponseEntity<?> getExportConfig(@PathVariable Long executionId) {
        return ResponseEntity.ok(pipelineService.buildTaskConfig(executionId));
    }

    @PostMapping("/executions/{executionId}/notify")
    public ResponseEntity<?> notify(@PathVariable Long executionId, @RequestBody NotifySourcePayload payload) {
        pipelineService.handleNotify(executionId, payload);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/executions/{executionId}/retry-failed-tasks")
    public ResponseEntity<?> retryFailedTasks(@PathVariable Long executionId) {
        pipelineService.retryFailedTasks(executionId);
        return ResponseEntity.status(HttpStatus.ACCEPTED).body("retry: running");
    }
}
