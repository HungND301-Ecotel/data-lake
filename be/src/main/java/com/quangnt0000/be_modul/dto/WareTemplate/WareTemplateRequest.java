package com.quangnt0000.be_modul.dto.WareTemplate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

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
}
