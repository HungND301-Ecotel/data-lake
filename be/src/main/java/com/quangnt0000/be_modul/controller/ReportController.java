package com.quangnt0000.be_modul.controller;

import com.quangnt0000.be_modul.dto.ReportDTO;
import com.quangnt0000.be_modul.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/report")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<?> createReport(@RequestBody ReportDTO request) {
        return reportService.createReport(request);
    }

    @GetMapping
    public ResponseEntity<?> getAllReports() {
        return reportService.getAllReports();
    }

    @GetMapping("/{report-id}")
    public ResponseEntity<?> getReportById(@PathVariable ("report-id") String reportId) {
        return reportService.getReportById(reportId);
    }

    @DeleteMapping("/{report-id}")
    public ResponseEntity<?> deleteReportById(@PathVariable ("report-id") String reportId) {
        return reportService.deleteReportById(reportId);
    }
}
