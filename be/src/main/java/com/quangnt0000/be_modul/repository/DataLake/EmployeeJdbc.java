package com.quangnt0000.be_modul.repository.DataLake;

import com.quangnt0000.be_modul.dto.Employee.EmployeeResponse;
import com.quangnt0000.be_modul.dto.Employee.EmployeeSearch;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class EmployeeJdbc {
    private final JdbcTemplate jdbcTemplate;

    public List<EmployeeResponse> search(EmployeeSearch request) {
        StringBuilder sql = new StringBuilder(
                """
                SELECT 
                    e.id AS id,
                    e.name AS name,
                    d.id AS department_id,
                    d.name AS department_name,
                    e.position AS position,
                    e.phone AS phone,
                    e.email AS email,
                    e.address AS address,
                    e.gender AS gender,
                    e.birthday AS birthday,
                    e.key_avatar AS key_avatar,
                    u.role AS role
                 FROM employee e
                 LEFT JOIN users u ON e.id = u.employee_id
                 LEFT JOIN department d ON e.department_id = d.id
                 WHERE e.deleted = false
                """
        );

        List<Object> params = new ArrayList<>();

        if (request.getKeyword() != null && !request.getKeyword().isEmpty()) {
            sql.append(" AND ( LOWER(e.name) LIKE ? OR LOWER(e.position) LIKE ? ) ");
            String keyword = "%" + request.getKeyword().toLowerCase() + "%";
            params.add(keyword);
            params.add(keyword);
        }


        if (request.getDepartmentId() != null) {
            sql.append(" AND e.department_id = ?");
            params.add(request.getDepartmentId());
        }

        sql.append(" ORDER BY ").append(request.getSortBy()).append(" ").append(request.getSort());

        int limit = request.getLimit();
        int offset = request.getPage() * request.getLimit();

        sql.append(" LIMIT ").append(limit).append(" OFFSET ").append(offset);

        return jdbcTemplate.query(
                sql.toString(),
                params.toArray(),
                new BeanPropertyRowMapper<>(EmployeeResponse.class)
        );
    }

    public Integer countFilter(EmployeeSearch request) {
        StringBuilder sql = new StringBuilder(
                """
                SELECT 
                    count(*)
                FROM employee e
                LEFT JOIN users u ON e.id = u.employee_id
                LEFT JOIN department d ON e.department_id = d.id
                WHERE e.deleted = false
                """
        );

        List<Object> params = new ArrayList<>();

        if (request.getKeyword() != null && !request.getKeyword().isEmpty()) {
            sql.append(" AND ( LOWER(e.name) LIKE ? OR LOWER(e.position) LIKE ? ) ");
            String keyword = "%" + request.getKeyword().toLowerCase() + "%";
            params.add(keyword);
            params.add(keyword);
        }


        if (request.getDepartmentId() != null) {
            sql.append(" AND e.department_id = ?");
            params.add(request.getDepartmentId());
        }

        return jdbcTemplate.queryForObject(sql.toString(), Integer.class, params.toArray());
    }

}
