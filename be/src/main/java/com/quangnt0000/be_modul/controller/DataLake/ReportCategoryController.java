package com.quangnt0000.be_modul.controller.DataLake;

import com.quangnt0000.be_modul.dto.ReportCategory.ReportCategoryRequest;
import com.quangnt0000.be_modul.dto.ReportCategory.ReportCategorySearch;
import com.quangnt0000.be_modul.service.DataLake.ReportCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/report-category")
@RequiredArgsConstructor
public class ReportCategoryController {
    private final ReportCategoryService reportCategoryService;

    @PostMapping
    public ResponseEntity<?> save(@RequestBody ReportCategoryRequest request) {
        return reportCategoryService.save(request);
    }

    @DeleteMapping("/{report-template-id}")
    public ResponseEntity<?> delete(@PathVariable ("report-template-id") String reportTemplateId) {
        return reportCategoryService.delete(reportTemplateId);
    }

    @GetMapping("/{report-template-id}")
    public ResponseEntity<?> findById(@PathVariable ("report-template-id") String reportTemplateId) {
        return reportCategoryService.findById(reportTemplateId);
    }

    @GetMapping
    public ResponseEntity<?> search(@ModelAttribute ReportCategorySearch request) {
        return reportCategoryService.search(request);
    }

    @GetMapping("/count/{department-id}")
    public ResponseEntity<?> countByDepartmentId(@PathVariable ("department-id") String departmentId) {
        return reportCategoryService.countByDepartmentId(departmentId);
    }
}
