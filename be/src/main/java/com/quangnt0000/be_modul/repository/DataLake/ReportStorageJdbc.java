package com.quangnt0000.be_modul.repository.DataLake;

import com.quangnt0000.be_modul.dto.ReportStorage.ReportStorageResponse;
import com.quangnt0000.be_modul.dto.ReportStorage.ReportStorageSearch;
import com.quangnt0000.be_modul.dto.ReportTemplate.ReportTemplateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class ReportStorageJdbc {
    private final JdbcTemplate jdbcTemplate;

    public List<ReportStorageResponse> search(ReportStorageSearch request){
        StringBuilder sql = new StringBuilder(
                """
                    SELECT
                       rs.id AS id,
                       rs.name AS name,
                       rs.description AS description,
                       rs.note AS note,
                       rs.file_key AS file_key,
                       rs.file_type AS file_type,
                       rc.name AS report_category_name,
                       e.name AS employee_name,
                       rs.created_at AS created_at,
                       rs.status AS status
                   FROM report_storage rs
                   LEFT JOIN report_category rc ON rc.id = rs.report_category_id
                   LEFT JOIN employee e ON e.id = rs.employee_id
                   WHERE rs.deleted = false 
                """);
        List<Object> params = new ArrayList<>();
        if (request.getReportCategoryId() != null) {
            sql.append(" and rs.report_category_id = ?");
            params.add(request.getReportCategoryId());
        }

        if (request.getKeyword() != null) {
            sql.append(" and rs.name like ?");
            params.add("%" + request.getKeyword() + "%");
        }
        if (request.getStatus() != null) {
            sql.append(" and rs.status = ?");
            params.add(request.getStatus());
        }

        return jdbcTemplate.query(sql.toString(),
                params.toArray(),
                new BeanPropertyRowMapper<>(ReportStorageResponse.class)
        );
    }

    public Integer count(ReportStorageSearch request){
        StringBuilder sql = new StringBuilder(
                """
                    SELECT
                       count(*)
                   FROM report_storage rs
                   LEFT JOIN report_category rc ON rc.id = rs.report_category_id
                   LEFT JOIN employee e ON e.id = rs.employee_id
                   WHERE rs.deleted = false 
                """);
        List<Object> params = new ArrayList<>();
        if (request.getReportCategoryId() != null) {
            sql.append(" and rs.report_category_id = ?");
            params.add(request.getReportCategoryId());
        }

        if (request.getKeyword() != null) {
            sql.append(" and rs.name like ?");
            params.add("%" + request.getKeyword() + "%");
        }
        if (request.getStatus() != null) {
            sql.append(" and rs.status = ?");
            params.add(request.getStatus());
        }

        return jdbcTemplate.queryForObject(sql.toString(), Integer.class, params.toArray());
    }

    public Map<String, Integer> getCountStatusByDepartment(String departmentId) {
        StringBuilder sql = new StringBuilder();
        sql.append("""
        SELECT rs.status AS status, COUNT(rs.status) AS count
        FROM department d
        LEFT JOIN report_category rc ON d.id = rc.department_id
        LEFT JOIN report_storage rs ON rs.report_category_id = rc.id
        WHERE rs.deleted = false AND rc.deleted = false AND d.id = ?
        GROUP BY rs.status
    """);

        List<Object> params = new ArrayList<>();
        params.add(departmentId);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql.toString(), params.toArray());

        Map<String, Integer> result = new HashMap<>();
        for (Map<String, Object> row : rows) {
            result.put((String) row.get("status"), ((Number) row.get("count")).intValue());
        }

        for (String status : List.of("PENDING", "IN_PROGRESS", "SUCCESS")) {
            result.putIfAbsent(status, 0);
        }

        return result;
    }


}
