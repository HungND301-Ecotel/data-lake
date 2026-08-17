package com.quangnt0000.be_modul.repository.report;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.quangnt0000.be_modul.dto.report.CoalConsumptionDataDTO;
import com.quangnt0000.be_modul.dto.report.CoalReportDataDTO;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class MaterialsReportRepository {
    private final JdbcTemplate jdbcTemplate;

    public List<CoalReportDataDTO> getReportData(
            String unitCode,
            Integer year,
            Integer month) {

        String sql = """
                SELECT
                    v.ma_don_vi,
                    v.ma_vthh1 AS product_code,
                    v.ten_vthh AS product_name,
                    v.ten_dvt AS unit,
                    CASE
                        WHEN m.report_column = 'export_sale_split'
                             AND v.ma_loai_dtpn = '01'
                             AND v.ma_nhom_dtpn IN ('02', '10')
                            THEN 'export_sale_internal_tkv'
                        WHEN m.report_column = 'export_sale_split'
                            THEN 'export_sale_external'
                        ELSE m.report_column
                    END AS report_column,
                    v.so_luong_bc AS qty
                FROM staging_vattu.vthh v
                JOIN staging_vattu.mapping_ptnx_report m
                     ON v.ma_ptnx = m.ma_ptnx
                WHERE v.ma_don_vi = ?
                  AND EXTRACT(YEAR FROM v.ngay_vao_so) = ?
                  AND EXTRACT(MONTH FROM v.ngay_vao_so) = ?
                  AND v.ma_ptnx <> 'Y07'
                  AND v.ma_vthh1 IS NOT NULL
                                                                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> new CoalReportDataDTO(
                        rs.getString("ma_don_vi"),
                        rs.getString("product_code"),
                        rs.getString("product_name"),
                        rs.getString("unit"),
                        rs.getString("report_column"),
                        Optional.ofNullable(rs.getBigDecimal("qty"))
                                .orElse(BigDecimal.ZERO)),
                unitCode,
                year,
                month);
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
