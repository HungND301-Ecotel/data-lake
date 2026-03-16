package com.quangnt0000.be_modul.dto.ReportTemplate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ReportTemplateRequest {
    private String id;
    private String name;
    private String description;
    private String reportType;
    private MultipartFile file;
    private String reportId;
    private String reportCategoryId;
}
