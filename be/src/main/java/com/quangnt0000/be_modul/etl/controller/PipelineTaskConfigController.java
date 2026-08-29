package com.quangnt0000.be_modul.etl.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.quangnt0000.be_modul.etl.dto.PipelineTaskConfigRequest;
import com.quangnt0000.be_modul.etl.dto.PipelineTaskConfigResponse;
import com.quangnt0000.be_modul.etl.service.PipelineTaskConfigService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/task-config")
public class PipelineTaskConfigController {
    private final PipelineTaskConfigService service;

    @GetMapping("/{id}")
    public ResponseEntity<PipelineTaskConfigResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<PipelineTaskConfigResponse>> getAllByPipelineId(
            @RequestParam Long pipelineId,
            @RequestParam(defaultValue = "false") boolean activeOnly) {
        if (activeOnly) {
            return ResponseEntity.ok(service.getActiveByPipelineId(pipelineId));
        }
        return ResponseEntity.ok(service.getAllByPipelineId(pipelineId));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody PipelineTaskConfigRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @Valid @RequestBody PipelineTaskConfigRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PatchMapping("/{id}/restore-active")
    public ResponseEntity<?> toggleActive(@PathVariable Long id) {
        return ResponseEntity.ok(service.restore(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
