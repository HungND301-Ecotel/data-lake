package com.quangnt0000.be_modul.dto.WareTemplate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareTemplateResponse {
    private Integer id;
    private String code;
    private String name;
    private String description;

    private Integer startRow;

    private String tableName;
    private String tableCode;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
