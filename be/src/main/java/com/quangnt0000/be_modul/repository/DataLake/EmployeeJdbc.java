package com.quangnt0000.be_modul.repository.DataLake;

import com.quangnt0000.be_modul.dto.Employee.EmployeeResponse;
import com.quangnt0000.be_modul.dto.Employee.EmployeeSearch;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class EmployeeJdbc {
    private final JdbcTemplate jdbcTemplate;

    public List<EmployeeResponse> search(EmployeeSearch request) {
        StringBuilder sql = new StringBuilder("""
                SELECT 
                    e.id AS id,
                    e.name AS name,
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
                WHERE e.deleted = false
                """);

        List<Object> params = new ArrayList<>();

        if (request.getKeyword() != null && !request.getKeyword().isEmpty()) {
            sql.append(" AND ( LOWER(e.name) LIKE ? OR LOWER(e.position) LIKE ? ) ");
            String keyword = "%" + request.getKeyword().toLowerCase() + "%";
            params.add(keyword);
            params.add(keyword);
        }

        if (request.getDepartmentId() != null) {
            sql.append(" AND EXISTS (SELECT 1 FROM employee_department ed WHERE ed.employee_id = e.id AND ed.department_id = ?)");
            params.add(request.getDepartmentId());
        }

        sql.append(" ORDER BY ").append(request.getSortBy()).append(" ").append(request.getSort());
        sql.append(" LIMIT ").append(request.getLimit())
        .append(" OFFSET ").append(request.getPage() * request.getLimit());

        List<EmployeeResponse> employees = jdbcTemplate.query(
                sql.toString(),
                params.toArray(),
                new BeanPropertyRowMapper<>(EmployeeResponse.class)
        );

        // Lấy departments cho từng employee
        if (!employees.isEmpty()) {
            String deptSql = """
                    SELECT ed.employee_id, d.id AS id, d.name AS name
                    FROM employee_department ed
                    JOIN department d ON ed.department_id = d.id
                    WHERE ed.employee_id IN (%s)
                    """.formatted(employees.stream()
                        .map(e -> "'" + e.getId() + "'")
                        .collect(Collectors.joining(",")));

            Map<String, List<EmployeeResponse.DepartmentInfo>> deptMap = new HashMap<>();

            jdbcTemplate.query(deptSql, rs -> {
                String empId = rs.getString("employee_id");
                EmployeeResponse.DepartmentInfo dept = new EmployeeResponse.DepartmentInfo(
                        rs.getString("id"),
                        rs.getString("name")
                );
                deptMap.computeIfAbsent(empId, k -> new ArrayList<>()).add(dept);
            });

            employees.forEach(e -> e.setDepartments(deptMap.getOrDefault(e.getId(), List.of())));
        }

        return employees;
    }

    public Integer countFilter(EmployeeSearch request) {
        StringBuilder sql = new StringBuilder(
                """
                SELECT 
                    count(*)
                FROM employee e
                LEFT JOIN users u ON e.id = u.employee_id
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
            sql.append(" AND EXISTS (SELECT 1 FROM employee_department ed WHERE ed.employee_id = e.id AND ed.department_id = ?)");
            params.add(request.getDepartmentId());
        }

        return jdbcTemplate.queryForObject(sql.toString(), Integer.class, params.toArray());
    }

}
