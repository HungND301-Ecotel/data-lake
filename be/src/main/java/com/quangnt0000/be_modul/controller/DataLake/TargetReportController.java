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

    @PostMapping
    public List<TargetReportResponse> createBulk(
            @RequestBody List<TargetReportRequest> requests
    ) {
        return targetReportService.createBulk(requests);
    }

    @PutMapping
    public List<TargetReportResponse> updateBulk(
            @RequestBody List<TargetReportRequest> requests
    ) {
        return targetReportService.updateBulk(requests);
    }

    @DeleteMapping
    public void deleteBulk(
            @RequestBody List<String> ids
    ) {
        targetReportService.deleteBulk(ids);
    }

    @GetMapping
    public List<DepartmentTargetResponse> getAll(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date
    ) {
        return targetReportService.getAll(date);
    }

    @GetMapping("/department/{departmentId}")
    public DepartmentTargetResponse getByDepartment(
            @PathVariable String departmentId,
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate date
    ) {
        return targetReportService.getByDepartment(departmentId, date);
    }
}
