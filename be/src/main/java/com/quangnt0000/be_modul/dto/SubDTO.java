package com.quangnt0000.be_modul.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class SubDTO {
    private String id;
    private String tableName;
    private String joinType;
    private String joinOn;
}
