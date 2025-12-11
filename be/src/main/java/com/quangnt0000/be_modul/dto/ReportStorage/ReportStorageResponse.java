package com.quangnt0000.be_modul.dto.ReportStorage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ReportStorageResponse {
    private String id;
    private String name;
    private String description;
    private String note;
    private String fileKey;
    private String fileType;
    private String reportCategoryName;
    private String employeeName;
    private String createdAt;
    private String status;
}
