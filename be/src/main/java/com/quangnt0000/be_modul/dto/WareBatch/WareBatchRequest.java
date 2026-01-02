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
    private Integer year;
    private Integer period;
    private MultipartFile file;
    private Integer wareTemplateId;
}
