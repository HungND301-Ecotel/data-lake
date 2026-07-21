package com.quangnt0000.be_modul.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CellErrorDetail {
    private Integer rowIndex;
    private String colAddress;
    private String fieldName;
    private String errorMessage;
}
