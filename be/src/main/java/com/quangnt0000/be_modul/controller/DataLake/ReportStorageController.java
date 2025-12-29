package com.quangnt0000.be_modul.controller.DataLake;

import com.quangnt0000.be_modul.dto.ReportStorage.ReportStorageRequest;
import com.quangnt0000.be_modul.dto.ReportStorage.ReportStorageSearch;
import com.quangnt0000.be_modul.modal.DataLake.ReportStorage;
import com.quangnt0000.be_modul.service.DataLake.ReportStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/report-storage")
@RequiredArgsConstructor
public class ReportStorageController {
    private final ReportStorageService reportStorageService;

    @PostMapping
    public ResponseEntity<?> saveReportStorage(@ModelAttribute ReportStorageRequest request) {
        return reportStorageService.saveReportStorage(request);
    }

    @DeleteMapping("/{report-storage-id}")
    public ResponseEntity<?> deleteReportStorage(@PathVariable ("report-storage-id") String reportStorageId) {
        return reportStorageService.deleteReportStorage(reportStorageId);
    }

    @GetMapping
    public ResponseEntity<?> getByCategory(@ModelAttribute ReportStorageSearch request) {
        return reportStorageService.getByCategory(request);
    }

    @GetMapping("/count-status-by-department/{department-id}")
    public ResponseEntity<?> getCountStatusByDepartment(@PathVariable ("department-id") String departmentId) {
        return reportStorageService.getCountStatusByDepartment(departmentId);
    }
}
