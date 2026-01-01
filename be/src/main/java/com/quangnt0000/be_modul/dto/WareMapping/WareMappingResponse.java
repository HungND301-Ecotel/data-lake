package com.quangnt0000.be_modul.dto.WareMapping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareMappingResponse {
    private Integer id;
    private Integer excelColumn;
    private String fieldName;
    private String fieldType;
    private String defaultValue;
}
