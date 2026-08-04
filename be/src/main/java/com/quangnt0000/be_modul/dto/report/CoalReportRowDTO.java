package com.quangnt0000.be_modul.dto.report;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CoalReportRowDTO {
    private String productCode;      // B - Mã sản phẩm (MA_VTHH1)
    private String productName;      // C - Tên sản phẩm (TEN_VTHH1)
    private String unit;             // D - Đơn vị tính (TEN_DVT)

    // ===== Tồn đầu kỳ =====
    private BigDecimal openingStock = BigDecimal.ZERO;   // E (1)

    // ===== Chi tiết NHẬP =====
    private BigDecimal importFromRaw            = BigDecimal.ZERO; // G (3)  Từ nguyên khai
    private BigDecimal importFromFinishedSale   = BigDecimal.ZERO; // H (4)  Từ bán TP [TODO]
    private BigDecimal importFromNonCoal        = BigDecimal.ZERO; // I (5)  Từ SP ngoài TC than [TODO]
    private BigDecimal importFromContract       = BigDecimal.ZERO; // J (6)  Từ giao thầu [TODO]
    private BigDecimal importFromRecovery       = BigDecimal.ZERO; // K (7)  Từ thu hồi khác
    private BigDecimal importInternalProcessed  = BigDecimal.ZERO; // L (8)  Nhập sau chế biến
    private BigDecimal importInternalBlended    = BigDecimal.ZERO; // M (9)  Nhập sau pha trộn
    private BigDecimal importInternalTransfer   = BigDecimal.ZERO; // N (10) Nhập chuyển kho
    private BigDecimal importPurchaseDomestic   = BigDecimal.ZERO; // O (11) Mua trong nước [TODO]
    private BigDecimal importPurchaseImport     = BigDecimal.ZERO; // P/Q (12/13) Nhập khẩu [TODO]

    // ===== Tổng nhập (tính toán, không nhận input) =====
    private BigDecimal totalImport = BigDecimal.ZERO;    // F (2) = SUM(G..Q)

    // ===== Chi tiết XUẤT =====
    private BigDecimal exportSaleInternalTkv    = BigDecimal.ZERO; // S (15) Bán trong TKV
    private BigDecimal exportSaleExternal       = BigDecimal.ZERO; // T (16) Bán ngoài TKV & SD nội bộ
    private BigDecimal exportInternalBlend      = BigDecimal.ZERO; // U (17) Xuất pha trộn
    private BigDecimal exportInternalProcess    = BigDecimal.ZERO; // V (18) Xuất chế biến
    private BigDecimal exportInternalTransfer   = BigDecimal.ZERO; // W (19) Xuất chuyển kho, chống cháy

    // ===== Tổng xuất (tính toán, không nhận input) =====
    private BigDecimal totalExport = BigDecimal.ZERO;    // R (14) = SUM(S..W)

    // ===== Điều chỉnh & Tồn cuối kỳ =====
    private BigDecimal adjustment    = BigDecimal.ZERO;  // X (20) Chênh lệch tăng/giảm
    private BigDecimal closingStock  = BigDecimal.ZERO;  

}
