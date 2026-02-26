package com.quangnt0000.be_modul.dto.WareBatch;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareBatchRequest {
    private Integer id;
    private String name;
    private String description;
    private MultipartFile file;
    private Integer wareTemplateId;
    
    // Thời gian báo cáo (có thể null)
    private Integer reportYear;   // Năm báo cáo
    private Integer reportMonth;  // Tháng báo cáo (1-12)
    private Integer reportDay;    // Ngày báo cáo (1-31)
}
