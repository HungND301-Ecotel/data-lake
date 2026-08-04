package com.quangnt0000.be_modul.dto.report;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class CoalConsumptionRowDTO {
    //  private String productCode;      // ma_vthh1
    // private String productName;      // ten_vthh1
    // private String unit;             // ten_dvt

    // private BigDecimal saleInternalTkv = BigDecimal.ZERO;   // bán trong TKV (Y01, khách hàng nhóm TKV)
    // private BigDecimal saleExternal    = BigDecimal.ZERO;   // bán ngoài TKV (Y01, khách hàng ngoài)
    // private BigDecimal internalUse     = BigDecimal.ZERO;   // dùng nội bộ (Y06)

    // private BigDecimal totalConsumption = BigDecimal.ZERO;  // = saleInternalTkv + saleExternal (+ internalUse nếu cần)
    private String productCode;
    private String productName;
    private String unit;

    private BigDecimal saleParentCompany = BigDecimal.ZERO;  // Bán cho công ty mẹ (Đá Bạc)
    private BigDecimal saleOther         = BigDecimal.ZERO;  // Y01 khác (CG1/CGCK1 - nghi lỗi, để riêng dễ soát)
    private BigDecimal internalUse       = BigDecimal.ZERO;  // Sử dụng nội bộ DN (Y06)

    private BigDecimal totalConsumption  = BigDecimal.ZERO;  // = saleParentCompany + saleOther
}
