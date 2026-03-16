package com.quangnt0000.be_modul.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class FilterDTO {
    private String id;
    private String alias;
    private String fieldKey;
    private String operatorList;
    private String valueType;
    private String defaultValue;
    private String defaultOperator;
    private String queryValue;
}
