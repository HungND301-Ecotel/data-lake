package com.quangnt0000.be_modul.controller.DataLake;

import com.quangnt0000.be_modul.dto.Target.TargetRequest;
import com.quangnt0000.be_modul.dto.Target.TargetResponse;
import com.quangnt0000.be_modul.service.DataLake.TargetService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/targets")
@RequiredArgsConstructor
public class TargetController {

    private final TargetService targetService;

    // CREATE
    @PostMapping
    public ResponseEntity<TargetResponse> createTarget(
            @RequestBody TargetRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(targetService.createTarget(request));
    }

    // CREATE BULK
    @PostMapping("/bulk")
    public ResponseEntity<List<TargetResponse>> createTargets(
            @RequestBody List<TargetRequest> requests) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(targetService.createTargets(requests));
    }

    // UPDATE
    @PutMapping
    public ResponseEntity<TargetResponse> updateTarget(
            @RequestBody TargetRequest request) {

        return ResponseEntity.ok(targetService.update(request));
    }

    // UPDATE BULK
    @PutMapping("/bulk")
    public ResponseEntity<List<TargetResponse>> updateTargets(
            @RequestBody List<TargetRequest> requests) {

        return ResponseEntity.ok(targetService.updateTargets(requests));
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTarget(
            @PathVariable String id) {

        targetService.deleteTarget(id);
        return ResponseEntity.noContent().build();
    }

    // DELETE BULK
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> deleteTargets(
            @RequestBody List<String> ids) {

        targetService.deleteTargets(ids);
        return ResponseEntity.noContent().build();
    }

    // GET ALL
    @GetMapping
    public List<TargetResponse> getTargets(
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return targetService.getTargets(departmentId, month);
    }
}
