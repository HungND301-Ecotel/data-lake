package com.quangnt0000.be_modul.service.DataLake;

import com.quangnt0000.be_modul.dto.FileResponse;
import com.quangnt0000.be_modul.dto.ReportDTO;
import com.quangnt0000.be_modul.dto.ReportTemplate.ReportTemplateRequest;
import com.quangnt0000.be_modul.dto.ReportTemplate.ReportTemplateResponse;
import com.quangnt0000.be_modul.modal.DataLake.ReportCategory;
import com.quangnt0000.be_modul.modal.DataLake.ReportTemplate;
import com.quangnt0000.be_modul.modal.DataLake.User;
import com.quangnt0000.be_modul.repository.DataLake.ReportCategoryRepository;
import com.quangnt0000.be_modul.repository.DataLake.ReportTemplateJdbc;
import com.quangnt0000.be_modul.repository.DataLake.ReportTemplateRepository;
import com.quangnt0000.be_modul.repository.DataLake.UserRepository;
import com.quangnt0000.be_modul.service.ReportService;
import com.quangnt0000.be_modul.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportTemplateService {
    private final ReportTemplateRepository reportTemplateRepository;
    private final ReportService reportService;
    private final UserRepository userRepository;
    private final ReportTemplateJdbc reportTemplateJdbc;
    private final S3Service s3Service;
    private final ReportCategoryRepository reportCategoryRepository;
    public ResponseEntity<?> addReportTemplate(ReportTemplateRequest request) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(userId).
                orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        ReportCategory reportCategory = reportCategoryRepository.findById(request.getReportCategoryId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report category not found"));
        ReportTemplate reportTemplate = ReportTemplate.builder()
                .name(request.getName())
                .description(request.getDescription())
                .reportType(request.getReportType())
                .employee(user.getEmployee())
                .reportCategory(reportCategory)
                .build();
        if (request.getReportType().equals("STATIC")){
            FileResponse fileResponse = s3Service.uploadFile("/report-temple", request.getFile());
            reportTemplate.setFileKey(fileResponse.getKey());
            reportTemplate.setFileType(fileResponse.getType());
            reportTemplateRepository.save(reportTemplate);
            return ResponseEntity.ok(reportTemplate.getReportId());
        }
        if (request.getReportType().equals("DYNAMIC")){
            String reportId = (String) reportService.createReport(
                    ReportDTO.builder()
                            .name(request.getName())
                            .pageType("landscape")
                            .marginTop(30)
                            .marginBottom(30)
                            .marginLeft(30)
                            .marginRight(30)
                            .items(new ArrayList<>())
                            .build()
            ).getBody();
            reportTemplate.setReportId(reportId);
            reportTemplate = reportTemplateRepository.save(reportTemplate);
            return ResponseEntity.ok(reportTemplate.getReportId());
        }
        return ResponseEntity.ok("Error");
    }

    public ResponseEntity<?> getByCategory(String categoryReportId) {
        List<ReportTemplateResponse> responseList = reportTemplateJdbc.getByCategory(categoryReportId);
        return ResponseEntity.ok(responseList);
    }

    public ResponseEntity<?> deleteReportTemplate(String reportTemplateId) {
        ReportTemplate reportTemplate = reportTemplateRepository.findById(reportTemplateId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report Template not found"));
        reportTemplate.setDeleted(true);
        reportTemplateRepository.save(reportTemplate);
        return ResponseEntity.ok("Deleted");
    }
}
