package com.quangnt0000.be_modul.repository.DataWH;

import com.quangnt0000.be_modul.dto.WareBatchAction.TimeCountDto;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class WareBatchActionJdbc {
    private final JdbcTemplate jdbcTemplate;

    /**
     * Lấy JdbcTemplate - sử dụng template động nếu được truyền vào, không thì dùng default
     */
    private JdbcTemplate getTemplate(JdbcTemplate dynamicTemplate) {
        return dynamicTemplate != null ? dynamicTemplate : jdbcTemplate;
    }

    public Map<String, Object> execute() {
        return execute(null);
    }

    public Map<String, Object> execute(JdbcTemplate dynamicTemplate) {
        StringBuilder sql = new StringBuilder("""
                SELECT
                            COALESCE(COUNT(DISTINCT CASE
                                WHEN wba.created_at >= CURRENT_DATE AND wba.inserted > 0
                                THEN wba.ware_batch_id END), 0) AS insert_today,

                            COALESCE(COUNT(DISTINCT CASE
                                WHEN wba.created_at >= CURRENT_DATE AND wba.updated > 0
                                THEN wba.ware_batch_id END), 0) AS update_today,

                            COALESCE(COUNT(DISTINCT CASE
                                WHEN wba.inserted > 0
                                THEN wba.ware_batch_id END), 0) AS insert_total,
                            COALESCE(COUNT(DISTINCT CASE
                                WHEN wba.updated > 0
                                THEN wba.ware_batch_id END), 0) AS update_total
                        FROM ware_batch_action wba
                        WHERE wba.deleted = false
                """);
        // Sử dụng COUNT(DISTINCT ware_batch_id) thay vì SUM(inserted/updated)
        // vì mục tiêu là đếm số batch đã phát sinh thao tác insert/update,
        // không phải tổng số bản ghi được insert/update.
        // Một batch có thể có nhiều row action, nên cần DISTINCT để tránh đếm trùng batch.
        return getTemplate(dynamicTemplate).queryForMap(sql.toString());
    }

    public List<TimeCountDto> countByDay() {
        return countByDay(null);
    }

    public List<TimeCountDto> countByDay(JdbcTemplate dynamicTemplate) {
        String sql = """
            SELECT
                TO_CHAR(created_at, 'YYYY-MM-DD') AS label,
                COUNT(*) AS total
            FROM ware_batch_action
            WHERE deleted = false
            GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
            ORDER BY label
        """;

        return getTemplate(dynamicTemplate).query(
                sql,
                (rs, rowNum) -> new TimeCountDto(
                        rs.getString("label"),
                        rs.getLong("total")
                )
        );
    }

    /* ================= MONTH (năm hiện tại) ================= */
    public List<TimeCountDto> countByMonth() {
        return countByMonth(null);
    }

    public List<TimeCountDto> countByMonth(JdbcTemplate dynamicTemplate) {
        String sql = """
            SELECT
                TO_CHAR(created_at, 'MM') AS label,
                COUNT(*) AS total
            FROM ware_batch_action
            WHERE deleted = false
              AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
            GROUP BY TO_CHAR(created_at, 'MM')
            ORDER BY label
        """;

        return getTemplate(dynamicTemplate).query(
                sql,
                (rs, rowNum) -> new TimeCountDto(
                        rs.getString("label"),
                        rs.getLong("total")
                )
        );
    }

    /* ================= YEAR ================= */
    public List<TimeCountDto> countByYear() {
        return countByYear(null);
    }

    public List<TimeCountDto> countByYear(JdbcTemplate dynamicTemplate) {
        String sql = """
            SELECT
                TO_CHAR(created_at, 'YYYY') AS label,
                COUNT(*) AS total
            FROM ware_batch_action
            WHERE deleted = false
            GROUP BY TO_CHAR(created_at, 'YYYY')
            ORDER BY label
        """;

        return getTemplate(dynamicTemplate).query(
                sql,
                (rs, rowNum) -> new TimeCountDto(
                        rs.getString("label"),
                        rs.getLong("total")
                )
        );
    }

    public List<TimeCountDto> topTable() {
        return topTable(null);
    }

    public List<TimeCountDto> topTable(JdbcTemplate dynamicTemplate) {
        StringBuilder sql = new StringBuilder( """
            SELECT
              table_name AS label,
              COUNT(*) AS total
            FROM ware_batch_action
            WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
            GROUP BY table_name
            ORDER BY total DESC
            LIMIT 10;
        """);

        return getTemplate(dynamicTemplate).query(
                sql.toString(),
                (rs, rowNum) -> new TimeCountDto(
                        rs.getString("label"),
                        rs.getLong("total")
                )
        );
    }
}
