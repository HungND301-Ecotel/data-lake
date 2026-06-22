package com.quangnt0000.be_modul.repository.DataWH;

import com.quangnt0000.be_modul.dto.WareBatch.WareBatchResponse;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchSearch;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class WareBatchJdbc {
    private final JdbcTemplate jdbcTemplate;

    public List<WareBatchResponse> search(WareBatchSearch request) {
        StringBuilder sql = new StringBuilder(
                """
                    SELECT 
                        wb.id AS id,
                        wb.code AS code,
                        wb.name AS name,
                        wt.table_code AS tableCode,
                        wt.table_name AS reportName,
                        wb.description AS description,
                        wb.s3_file_key AS s3_file_key,
                        wb.created_at AS created_at,
                        wb.updated_at AS updated_at,
                        e.name AS employee_name,
                        wb.status AS ware_batch_status,
                        wb.report_year AS report_year,
                        wb.report_month AS report_month,
                        wb.report_day AS report_day,
                        CASE
                            WHEN EXISTS (
                                SELECT 1
                                FROM ware_batch_action wba
                                WHERE wba.ware_batch_id = wb.id
                            )
                            THEN 'true'
                            ELSE 'false'
                        END AS is_pushed
                    FROM ware_batch wb
                    LEFT JOIN employee e ON wb.employee_id = e.id
                    LEFT JOIN ware_template wt ON wb.ware_template_id = wt.id
                    LEFT JOIN ware_category wc ON wt.ware_category_id = wc.id
                    LEFT JOIN department d ON wc.department_id = d.id
                    WHERE wb.deleted = false
                """
        );
        List<Object> params = new ArrayList<>();
        if (request.getKeyword() != null) {
            sql.append(" and (wb.name like ? or wb.code like ? ) ");
            params.add("%" + request.getKeyword() + "%");
            params.add("%" + request.getKeyword() + "%");
        }

        if (request.getWareTemplateId() != null) {
            sql.append(" and wb.ware_template_id = ? ");
            params.add(request.getWareTemplateId());
        }

        if (request.getDepartmentIds() != null && !request.getDepartmentIds().isEmpty()) {
            sql.append(" and d.id IN (");
            for (int i = 0; i < request.getDepartmentIds().size(); i++) {
                sql.append("?");
                if (i < request.getDepartmentIds().size() - 1) {
                    sql.append(",");
                }
                params.add(request.getDepartmentIds().get(i));
            }
            sql.append(") ");
        }

        if (request.getStatus() != null) {
            sql.append(" and wb.status = ? ");
            params.add(request.getStatus().name());
        }

        int limit = request.getLimit();
        int offset = request.getPage() * request.getLimit();

        sql.append(" ORDER BY wb.created_at DESC");

        sql.append(" LIMIT ").append(limit).append(" OFFSET ").append(offset);
        return jdbcTemplate.query(sql.toString(),
                params.toArray(),
                new BeanPropertyRowMapper<>(WareBatchResponse.class)
        );
    }

    public Integer count(WareBatchSearch request) {
        StringBuilder sql = new StringBuilder(
                """
                    SELECT 
                        count(*)
                    FROM ware_batch wb
                    LEFT JOIN employee e ON wb.employee_id = e.id
                    LEFT JOIN ware_template wt ON wb.ware_template_id = wt.id
                    LEFT JOIN ware_category wc ON wt.ware_category_id = wc.id
                    LEFT JOIN department d ON wc.department_id = d.id
                    WHERE wb.deleted = false
                """
        );
        List<Object> params = new ArrayList<>();
        if (request.getKeyword() != null) {
            sql.append(" and (wb.name like ? or wb.code like ? ) ");
            params.add("%" + request.getKeyword() + "%");
            params.add("%" + request.getKeyword() + "%");
        }

        if (request.getWareTemplateId() != null) {
            sql.append(" and wb.ware_template_id = ? ");
            params.add(request.getWareTemplateId());
        }

        if (request.getDepartmentIds() != null && !request.getDepartmentIds().isEmpty()) {
            sql.append(" and d.id IN (");
            for (int i = 0; i < request.getDepartmentIds().size(); i++) {
                sql.append("?");
                if (i < request.getDepartmentIds().size() - 1) {
                    sql.append(",");
                }
                params.add(request.getDepartmentIds().get(i));
            }
            sql.append(") ");
        }

        if (request.getStatus() != null) {
            sql.append(" and wb.status = ? ");
            params.add(request.getStatus().name());
        }

        return jdbcTemplate.queryForObject(sql.toString(), Integer.class, params.toArray());
    }
}
