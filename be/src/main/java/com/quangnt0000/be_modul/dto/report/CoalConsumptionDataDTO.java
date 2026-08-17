package com.quangnt0000.be_modul.dto.report;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CoalConsumptionDataDTO {
    private String productCode;       // ma_vthh
    private String productName;       // ten_vthh
    private String unit;              // ten_dvt
    private String importExportMethodCode; // ma_ptnx
    private String partnerCode;       // ma_dtpn
    private String partnerGroupCode;  // ma_nhom_dtpn
    private String partnerName;       // ten_dtpn
    private BigDecimal qty;
}
