package com.quangnt0000.be_modul.repository.DataLake;

import com.quangnt0000.be_modul.dto.ReportTemplate.ReportTemplateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class ReportTemplateJdbc {
    private final JdbcTemplate jdbcTemplate;

    public List<ReportTemplateResponse> getByCategory(String reportCategoryId){
        StringBuilder sql = new StringBuilder(
        """
            SELECT
               rt.id AS id,
               rt.name AS name,
               rt.description AS description,
               rt.file_type AS file_type,
               rt.report_type AS report_type,
               rt.created_at AS created_at,
               rt.file_key AS file_key,
               rt.report_id AS report_id,
               rc.name AS report_category_name,
               e.name AS employee_name
           FROM report_template rt
           LEFT JOIN report_category rc ON rc.id = rt.report_category_id
           LEFT JOIN employee e ON e.id = rt.employee_id
           WHERE rt.deleted = false AND rc.id = ?
                
        """);

        List<Object> params = new ArrayList<>();
        params.add(reportCategoryId);

        return jdbcTemplate.query(sql.toString(),
                params.toArray(),
                new BeanPropertyRowMapper<>(ReportTemplateResponse.class)
        );

    }
}
