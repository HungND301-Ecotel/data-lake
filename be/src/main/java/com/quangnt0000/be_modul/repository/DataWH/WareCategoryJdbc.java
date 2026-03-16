package com.quangnt0000.be_modul.repository.DataWH;

import com.quangnt0000.be_modul.dto.WareCategory.WareCategoryResponse;
import com.quangnt0000.be_modul.dto.WareCategory.WareCategorySearch;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class WareCategoryJdbc {
    private final JdbcTemplate jdbcTemplate;

    public List<WareCategoryResponse> search(WareCategorySearch request) {
        StringBuilder sql = new StringBuilder(
            """
                SELECT 
                    wc.id AS id,
                    wc.name AS name,
                    wc.code AS code,
                    wc.description AS description,
                    wc.created_at AS created_at,
                    wc.updated_at AS updated_at,
                    d.id AS department_id,
                    d.name AS department_name,
                    d.code AS department_code,
                    COUNT(wt.id) AS total_template
                FROM ware_category wc
                JOIN department d ON d.id = wc.department_id
                LEFT JOIN ware_template wt ON wt.ware_category_id = wc.id AND wt.deleted = false
                WHERE wc.deleted = false
            """
        );
        List<Object> params = new ArrayList<>();
        if (request.getKeyword() != null) {
            sql.append(" and (wc.name like ? or wc.code like ? ) ");
            params.add("%" + request.getKeyword() + "%");
            params.add("%" + request.getKeyword() + "%");
        }

        if (request.getDepartmentId() != null) {
            sql.append(" and wc.department_id = ? ");
            params.add(request.getDepartmentId());
        }

        sql.append(" GROUP BY wc.id, wc.name, wc.code, wc.description, wc.created_at, wc.updated_at, d.id, d.name, d.code ");

        int limit = request.getLimit();
        int offset = request.getPage() * request.getLimit();

        sql.append(" LIMIT ").append(limit).append(" OFFSET ").append(offset);
        return jdbcTemplate.query(sql.toString(),
                params.toArray(),
                new BeanPropertyRowMapper<>(WareCategoryResponse.class)
        );
    }

    public Integer count(WareCategorySearch request) {
        StringBuilder sql = new StringBuilder(
                """
                    SELECT 
                        count(*)
                    FROM ware_category wc
                    JOIN department d ON d.id = wc.department_id
                    WHERE wc.deleted = false
                """
        );
        List<Object> params = new ArrayList<>();
        if (request.getKeyword() != null) {
            sql.append(" and (wc.name like ? or wc.code like ? ) ");
            params.add("%" + request.getKeyword() + "%");
            params.add("%" + request.getKeyword() + "%");
        }

        if (request.getDepartmentId() != null) {
            sql.append(" and wc.department_id = ? ");
            params.add(request.getDepartmentId());
        }

        return jdbcTemplate.queryForObject(sql.toString(), Integer.class, params.toArray());
    }
}
