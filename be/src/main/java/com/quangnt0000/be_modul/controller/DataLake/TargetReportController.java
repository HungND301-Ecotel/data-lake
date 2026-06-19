package com.quangnt0000.be_modul.controller.DataLake;

import com.quangnt0000.be_modul.dto.TargetReport.DepartmentTargetResponse;
import com.quangnt0000.be_modul.dto.TargetReport.TargetReportRequest;
import com.quangnt0000.be_modul.dto.TargetReport.TargetReportResponse;
import com.quangnt0000.be_modul.service.DataLake.TargetReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/target-reports")
@RequiredArgsConstructor
public class TargetReportController {

    private final TargetReportService targetReportService;

    @PostMapping("/bulk")
    public List<TargetReportResponse> createBulk(
            @RequestBody List<TargetReportRequest> requests
    ) {
        return targetReportService.createBulk(requests);
    }

    @PutMapping("/bulk")
    public List<TargetReportResponse> updateBulk(
            @RequestBody List<TargetReportRequest> requests
    ) {
        return targetReportService.updateBulk(requests);
    }

    @DeleteMapping("/bulk")
    public void deleteBulk(
            @RequestBody List<String> ids
    ) {
        targetReportService.deleteBulk(ids);
    }

    @GetMapping
    public List<DepartmentTargetResponse> getDepartmentTargets(
            @RequestParam(required = false) String departmentId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date
    ) {
        return targetReportService.getDepartmentTargets(departmentId, date);
    }

    // CREATE
    @PostMapping
    public TargetReportResponse create(@RequestBody TargetReportRequest request) {
        return targetReportService.create(request);
    }

    // UPDATE
    @PutMapping
    public TargetReportResponse update(@RequestBody TargetReportRequest request) {
        return targetReportService.update(request);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        targetReportService.delete(id);
    }

    // GET (filter optional theo department, date) - trả list phẳng
    @GetMapping("/list")
    public List<TargetReportResponse> getTargetReports(
            @RequestParam(required = false) String departmentId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date
    ) {
        return targetReportService.getTargetReports(departmentId, date);
    }
}
