package com.quangnt0000.be_modul.dto.WareTemplate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareTemplateRequest {
    private Integer id;
    private String code;
    private String name;
    private String description;
    private Integer startRow;
    private Integer wareCategoryId;

    private String tableName;
    private String tableCode;
    private MultipartFile excelFile;
}
