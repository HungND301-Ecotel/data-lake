package com.quangnt0000.be_modul.dto.WareBatch;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareBatchResponse {
    private Integer id;
    private String code;
    private String name;
    private String tableCode;
    private String reportName;
    private String description;
    private String s3FileKey;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String employeeName;
    private String wareBatchStatus;
    private Boolean isPushed;
    
    // Thời gian báo cáo
    private Integer reportYear;
    private Integer reportMonth;
    private Integer reportDay;
}
