package com.quangnt0000.be_modul.dto.report;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CoalReportDataDTO {
    private String maDonVi;
    private String productCode;
    private String productName;
    private String unit;
    private String reportColumn;
    private BigDecimal qty;
}
