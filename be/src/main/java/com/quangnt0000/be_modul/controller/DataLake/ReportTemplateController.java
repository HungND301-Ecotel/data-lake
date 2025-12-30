package com.quangnt0000.be_modul.controller.DataLake;

import com.quangnt0000.be_modul.dto.ReportTemplate.ReportTemplateRequest;
import com.quangnt0000.be_modul.modal.DataLake.ReportTemplate;
import com.quangnt0000.be_modul.service.DataLake.ReportTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/report-template")
@RequiredArgsConstructor
public class ReportTemplateController {
    private final ReportTemplateService reportTemplateService;

    @PostMapping
    public ResponseEntity<?> addReportTemplate(@ModelAttribute ReportTemplateRequest request) {
        return reportTemplateService.addReportTemplate(request);
    }

    @GetMapping("/category-report/{category-report-id}")
    public ResponseEntity<?> getByCategory(@PathVariable ("category-report-id") String categoryReportId) {
        return reportTemplateService.getByCategory(categoryReportId);
    }

    @DeleteMapping("/{report-template-id}")
    public ResponseEntity<?> deleteReportTemplate(@PathVariable ("report-template-id") String reportTemplateId) {
        return reportTemplateService.deleteReportTemplate(reportTemplateId);
    }
}
