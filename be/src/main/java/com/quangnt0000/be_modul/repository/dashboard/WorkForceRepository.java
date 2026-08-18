package com.quangnt0000.be_modul.repository.dashboard;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import com.quangnt0000.be_modul.dto.dashboard.WorkforceResponse;

import lombok.RequiredArgsConstructor;

@Repository
@RequiredArgsConstructor
public class WorkForceRepository {
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private String sqlBaoCao; // đọc 1 lần từ file, cache lại

    public List<WorkforceResponse> getWorkForce(LocalDate ngayBaoCao, JdbcTemplate dynamicTemplate) {
        NamedParameterJdbcTemplate templateToUse = dynamicTemplate != null
                ? new NamedParameterJdbcTemplate(dynamicTemplate)
                : jdbcTemplate;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("ngayBaoCao", ngayBaoCao);

        try {
            return templateToUse.query(getSql(), params, (rs, rowNum) -> {
                WorkforceResponse response = WorkforceResponse.builder()
                        .departmentCode(rs.getString("MA_PBAN"))
                        .departmentName(rs.getString("TEN_PBAN"))
                        .departmentGroupCode(rs.getString("MA_NHOM_PBAN"))
                        .departmentGroupName(rs.getString("TEN_NHOM_PBAN"))
                        .shiftCode(rs.getString("MA_CA"))
                        .shiftName(rs.getString("TEN_CA"))
                        .totalHeadcount(rs.getInt("TONG_NHAN_LUC"))
                        .totalWorking(rs.getInt("TONG_DI_LAM"))
                        .undergroundWorkers(rs.getInt("TLO_DI_LAM"))
                        .electricalAndOtherWorkers(rs.getInt("CODIEN"))
                        .managementAndSupport(rs.getInt("QLY_PVU"))
                        .totalAbsent(rs.getInt("TONG_VANG"))
                        .sickLeave(rs.getInt("OM"))
                        .annualLeave(rs.getInt("PHEP"))
                        .maternityLeave(rs.getInt("TU_TUC"))
                        .meetingAndTraining(rs.getInt("HOI_HOP"))
                        .unauthorizedAbsence(rs.getInt("VANG"))
                        .undergroundWorkersAbsent(rs.getInt("TLO_VANG_TRONG_NGAY"))
                        .build();

                return response;
            });
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }

    }

    /**
     * Đọc câu SQL từ file resources/sql/nhan-luc-bao-cao.sql (đặt file này vào
     * src/main/resources/sql/nhan-luc-bao-cao.sql của project).
     * Cache lại để không đọc file mỗi lần gọi.
     */
    private String getSql() {
        if (sqlBaoCao == null) {
            try (InputStream is = new ClassPathResource("/work_force.sql").getInputStream()) {
                sqlBaoCao = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            } catch (IOException e) {
                throw new IllegalStateException("Khong doc duoc file SQL work_force.sql", e);
            }
        }
        return sqlBaoCao;
    }
}
