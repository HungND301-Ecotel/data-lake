package com.quangnt0000.be_modul.dto.WareMapping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareMappingRequest {
    private Integer id;
    private String fieldName;
    private String fieldValue; //string-number
    private String fieldType;   //row - cell - input
    private Boolean isKeyColumn;
    private Boolean isScopFilter;
    private String cellAddress; //địa chỉ cell
    private Integer wareTemplateId;
}
