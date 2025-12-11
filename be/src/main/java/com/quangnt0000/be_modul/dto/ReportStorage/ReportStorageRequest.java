package com.quangnt0000.be_modul.dto.ReportStorage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ReportStorageRequest {
    private String id;
    private String name;
    private String description;
    private String note;
    private MultipartFile file;
    private String reportCategoryId;
}
