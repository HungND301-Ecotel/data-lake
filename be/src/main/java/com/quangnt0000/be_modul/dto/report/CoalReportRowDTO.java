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
    // ===== Phân nhóm dòng báo cáo (I, II, III, IV, V) =====
    private String reportGroup; // 'I' | 'II' | 'III' | 'IV' | 'V'
    private String reportGroupName; // "THAN SẠCH THÀNH PHẨM", ...

    // ===== Định danh sản phẩm =====
    private String productCode; // B - MA_VTHH
    private String productName; // C - TEN_VTHH
    private String unit; // D - TEN_DVT

    // ===== Tồn đầu kỳ =====
    private BigDecimal openingStock = BigDecimal.ZERO; // cột 1

    // ===== Chi tiết NHẬP (cột 3-13) =====
    private BigDecimal importFromRaw = BigDecimal.ZERO; // cột 3 - Từ nguyên khai
    private BigDecimal importFromFinishedSale = BigDecimal.ZERO; // cột 4 - Từ bán TP [TODO]
    private BigDecimal importFromNonCoal = BigDecimal.ZERO; // cột 5 - Từ SP ngoài TC than [TODO]
    private BigDecimal importFromContract = BigDecimal.ZERO; // cột 6 - Từ giao thầu [TODO]
    private BigDecimal importFromRecovery = BigDecimal.ZERO; // cột 7 - Từ thu hồi khác
    private BigDecimal importInternalProcessed = BigDecimal.ZERO; // cột 8 - Nhập sau chế biến
    private BigDecimal importInternalBlended = BigDecimal.ZERO; // cột 9 - Nhập sau pha trộn
    private BigDecimal importInternalTransfer = BigDecimal.ZERO; // cột 10 - Nhập chuyển kho
    private BigDecimal importPurchaseInTkv = BigDecimal.ZERO; // cột 11 - Than mua TRONG TKV [TODO]
    private BigDecimal importPurchaseDomestic = BigDecimal.ZERO; // cột 12 - Mua ngoài TKV (trong nước) [TODO]
    private BigDecimal importPurchaseImport = BigDecimal.ZERO; // cột 13 - Nhập khẩu [TODO]

    // ===== Tổng nhập (tính toán) =====
    private BigDecimal totalImport = BigDecimal.ZERO; // cột 2 = SUM(3..13)

    // ===== Chi tiết XUẤT (cột 15-19) =====
    private BigDecimal exportSaleInternalTkv = BigDecimal.ZERO; // cột 15 - Bán trong TKV
    private BigDecimal exportSaleExternal = BigDecimal.ZERO; // cột 16 - Bán ngoài TKV & SD nội bộ
    private BigDecimal exportInternalBlend = BigDecimal.ZERO; // cột 17 - Xuất pha trộn
    private BigDecimal exportInternalProcess = BigDecimal.ZERO; // cột 18 - Xuất chế biến
    private BigDecimal exportInternalTransfer = BigDecimal.ZERO; // cột 19 - Xuất chuyển kho

    // ===== Tổng xuất (tính toán) =====
    private BigDecimal totalExport = BigDecimal.ZERO; // cột 14 = SUM(15..19)

    // ===== Điều chỉnh & Tồn cuối kỳ =====
    private BigDecimal adjustment = BigDecimal.ZERO; // cột 20
    private BigDecimal closingStock = BigDecimal.ZERO; // cột 21 = 1+2-14+20
}
