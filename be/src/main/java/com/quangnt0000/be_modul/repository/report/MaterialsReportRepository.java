package com.quangnt0000.be_modul.repository.report;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.quangnt0000.be_modul.dto.report.CoalConsumptionDataDTO;
import com.quangnt0000.be_modul.dto.report.CoalReportDataDTO;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Repository
@RequiredArgsConstructor
@Slf4j
public class MaterialsReportRepository {
    private final JdbcTemplate jdbcTemplate;

    public List<CoalReportDataDTO> getReportData(
            Integer year,
            Integer month) {

        String sql = """
                 SELECT
                    v.ma_vthh1 AS product_code,
                    v.ten_vthh AS product_name,
                    v.ten_dvt AS unit,
                    v.ma_ptnx,
                    m.nhom AS nhom,
                    CASE
                        WHEN m.report_column = 'export_sale_split'
                             AND v.ma_loai_dtpn = '01'
                             AND v.ma_nhom_dtpn IN ('02', '10')
                            THEN 'export_sale_internal_tkv'
                        WHEN m.report_column = 'export_sale_split'
                            THEN 'export_sale_external'
                        ELSE m.report_column
                    END AS report_column,
                    v.so_luong_bc AS qty,
                    v.ma_nhom_vthh,
                    v.ten_nhom_vthh
                FROM staging_vattu.vthh v
                LEFT JOIN staging_vattu.mapping_ptnx_report m
                     ON v.ma_ptnx = m.ma_ptnx
                WHERE
                  EXTRACT(YEAR FROM v.ngay_vao_so) = ?
                  AND EXTRACT(MONTH FROM v.ngay_vao_so) = ?
                  AND v.ma_ptnx <> 'Y07'
                  AND v.ma_vthh1 IS NOT NULL
                                                                """;

        List<CoalReportDataDTO> all = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new CoalReportDataDTO(
                        rs.getString("product_code"),
                        rs.getString("product_name"),
                        rs.getString("unit"),
                        rs.getString("report_column"),
                        rs.getString("ma_nhom_vthh"),
                        rs.getString("ten_nhom_vthh"),
                        rs.getString("nhom"),
                        Optional.ofNullable(rs.getBigDecimal("qty"))
                                .orElse(BigDecimal.ZERO)),
                year,
                month);

                List<String> unmappedCodes = all.stream()
                .filter(r -> r.getReportColumn() == null)
                .map(CoalReportDataDTO::getProductCode)
                .distinct()
                .toList();
        if (!unmappedCodes.isEmpty()) {
            log.warn("Các MA_PTNX chưa có trong mapping_ptnx_report (kỳ {}/{}), " +
                            "đang bị loại khỏi báo cáo, cần rà soát lại mapping",
                    month, year);
        }
 
        return all.stream().filter(r -> r.getReportColumn() != null).toList();
    }

    /**
     * Tính tồn đầu kỳ = tồn cuối kỳ của tháng trước đó.
     * Dùng cột 'nhom' (NHAP/XUAT) trong mapping_ptnx_report để phân biệt nhập/xuất,
     * và cột report_column = 'adjustment' cho điều chỉnh.
     *
     * Công thức: Closing = Opening(=0) + TotalImport - TotalExport + Adjustment
     */
    public Map<String, BigDecimal> getOpeningStockForAllProducts(Integer year, Integer month) {
        int prevYear = year;
        int prevMonth = month - 1;
        if (prevMonth < 1) {
            prevMonth = 12;
            prevYear = year - 1;
        }

        String sql = """
                SELECT
                    v.ma_vthh1 AS product_code,
                    COALESCE(SUM(CASE WHEN m.nhom = 'NHAP' AND m.report_column <> 'adjustment'
                                       THEN v.so_luong_bc ELSE 0 END), 0)
                    - COALESCE(SUM(CASE WHEN m.nhom = 'XUAT' AND m.report_column <> 'adjustment'
                                       THEN v.so_luong_bc ELSE 0 END), 0)
                    + COALESCE(SUM(CASE WHEN m.report_column = 'adjustment' AND m.nhom = 'NHAP'
                                       THEN v.so_luong_bc ELSE 0 END), 0)
                    - COALESCE(SUM(CASE WHEN m.report_column = 'adjustment' AND m.nhom = 'XUAT'
                                       THEN v.so_luong_bc ELSE 0 END), 0)
                    AS opening_stock
                FROM staging_vattu.vthh v
                JOIN staging_vattu.mapping_ptnx_report m
                    ON v.ma_ptnx = m.ma_ptnx
                WHERE (
                    EXTRACT(YEAR FROM v.ngay_vao_so) < ?
                    OR (EXTRACT(YEAR FROM v.ngay_vao_so) = ? AND EXTRACT(MONTH FROM v.ngay_vao_so) <= ?)
                )
                AND v.ma_ptnx <> 'Y07'
                AND v.ma_vthh1 IS NOT NULL
                GROUP BY v.ma_vthh1
                """;

        Map<String, BigDecimal> result = new HashMap<>();
        jdbcTemplate.query(sql, rs -> {
            result.put(rs.getString("product_code"), rs.getBigDecimal("opening_stock"));
        }, prevYear, prevYear, prevMonth);

        return result;
    }

    public List<CoalConsumptionDataDTO> getConsumptionData(
            Integer year, Integer month) {

        String sql = """
                SELECT
                    v.ma_vthh1 AS product_code,
                    v.ten_vthh AS product_name,
                    v.ten_dvt AS unit,
                    v.ma_ptnx,
                    v.ma_dtpn,
                    dt.ten_dtpn,
                    dt.ma_nhom_dtpn,
                    v.so_luong_bc AS qty
                FROM staging_vattu.vthh v
                LEFT JOIN staging_vattu.dm_dtpn dt ON v.ma_dtpn = dt.ma_dtpn
                WHERE EXTRACT(YEAR FROM v.ngay_vao_so) = ?
                  AND EXTRACT(MONTH FROM v.ngay_vao_so) = ?
                  AND v.ma_ptnx IN ('Y01', 'Y06')
                  AND v.ma_vthh1 IS NOT NULL
                        """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new CoalConsumptionDataDTO(
                        rs.getString("product_code"),
                        rs.getString("product_name"),
                        rs.getString("unit"),
                        rs.getString("ma_ptnx"),
                        rs.getString("ma_dtpn"),
                        rs.getString("ten_dtpn"),
                        rs.getString("ma_nhom_dtpn"),
                        Optional.ofNullable(rs.getBigDecimal("qty")).orElse(BigDecimal.ZERO)),
                year, month);
    }
}
