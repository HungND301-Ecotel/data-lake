package com.quangnt0000.be_modul.dto.report;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import lombok.Data;

@Data
public class CoalReportGroupDTO {
    private String groupCode;   // ma_nhom_vthh
    private String groupName;   // ten_nhom_vthh
    private List<CoalReportRowDTO> products = new ArrayList<>();
 
    // Subtotal - cộng dồn từ các dòng con, cùng cấu trúc field với CoalReportRowDTO
    private BigDecimal openingStock = BigDecimal.ZERO;
    private BigDecimal totalImport = BigDecimal.ZERO;
    private BigDecimal totalExport = BigDecimal.ZERO;
    private BigDecimal adjustment = BigDecimal.ZERO;
    private BigDecimal closingStock = BigDecimal.ZERO;
}
