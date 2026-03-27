package com.quangnt0000.be_modul.repository.DataLake;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class ReportCategoryJdbc {
    private final JdbcTemplate jdbcTemplate;

    public Map<String, Integer> count(String departmentId) {
        List<Object> params = new ArrayList<>();
        StringBuilder sql = new StringBuilder(
                """
                SELECT 
                    rc.name AS categoryName,
                    COUNT(rt.id) AS templateCount
                FROM report_category rc
                LEFT JOIN report_template rt 
                    ON rc.id = rt.report_category_id AND rt.deleted = false
                WHERE rc.deleted = false
                  AND rc.department_id = ?
                GROUP BY rc.name
                """
        );
        params.add(departmentId);

        List<Map<String, Object>> list = jdbcTemplate.queryForList(sql.toString(), params.toArray());

        Map<String, Integer> result = new HashMap<>();
        for (Map<String, Object> row : list) {
            String name = (String) row.get("categoryName");
            Integer count = ((Number) row.get("templateCount")).intValue();
            result.put(name, count);
        }

        return result;
    }


}
