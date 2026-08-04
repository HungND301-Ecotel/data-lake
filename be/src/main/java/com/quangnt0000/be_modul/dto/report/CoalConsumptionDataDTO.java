package com.quangnt0000.be_modul.dto.report;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CoalConsumptionDataDTO {
    private String maDonVi;
    private String productCode;       // ma_vthh1
    private String productName;       // ten_vthh1
    private String unit;              // ten_dvt
    private String consumptionType;   // sale_internal_tkv | sale_external | internal_use
    private BigDecimal qty;
}
