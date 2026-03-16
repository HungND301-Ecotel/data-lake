package com.quangnt0000.be_modul.dto.ReportTemplate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ReportTemplateResponse {
    private String id;
    private String name;
    private String description;
    private String fileType;
    private String reportType;
    private String fileKey;
    private String reportId;
    private String reportCategoryName;
    private String employeeName;
    private String createAt;
}
