package com.quangnt0000.be_modul.dto.report;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

import lombok.Data;

@Data
public class CoalConsumptionRowDTO {
    private String productCode;
    private String productName;
    private String unit;

    // ===== Bán cho công ty mẹ =====
    private Map<String, BigDecimal> soldToParent = new LinkedHashMap<>(); // key = ma_dtpn
    private Map<String, String> parentNames = new LinkedHashMap<>();            // key = ma_dtpn, value = ten_dtpn thật từ DM_DTPN
 
    // ===== Bán cho công ty con trong Tập đoàn =====
    private Map<String, BigDecimal> soldToSubsidiary = new LinkedHashMap<>();
    private Map<String, String> subsidiaryNames = new LinkedHashMap<>();
 
    // ===== Bán ngoài Tập đoàn =====
    private Map<String, BigDecimal> soldToExternal = new LinkedHashMap<>();
    private Map<String, String> externalNames = new LinkedHashMap<>();

    // Sử dụng nội bộ DN
    private BigDecimal internalUse = BigDecimal.ZERO;

    // Tổng tiêu thụ
    private BigDecimal totalConsumption = BigDecimal.ZERO;

    private BigDecimal totalSoldToParent     = BigDecimal.ZERO;
    private BigDecimal totalSoldToSubsidiary = BigDecimal.ZERO;
    private BigDecimal totalSoldToExternal   = BigDecimal.ZERO;
}
