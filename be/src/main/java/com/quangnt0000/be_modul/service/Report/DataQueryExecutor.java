package com.quangnt0000.be_modul.service.Report;

import com.quangnt0000.be_modul.modal.Report.ReportDataQuery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Chạy một truy vấn trong danh mục đã duyệt và trả về kết quả dạng bảng.
 *
 * <p>Ba lớp bảo vệ: câu lệnh đã qua {@link QueryGuard} lúc khai báo, tham số
 * luôn được bind chứ không nối chuỗi, và mỗi lần chạy đều có trần số dòng cùng
 * thời gian chờ.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DataQueryExecutor {

    private static final int QUERY_TIMEOUT_SECONDS = 30;

    private final DataSource dataSource;
    private final QueryGuard queryGuard;

    public static class QueryResult {
        public List<String> columns = new ArrayList<>();
        public List<Map<String, Object>> rows = new ArrayList<>();

        public int rowCount() {
            return rows.size();
        }

        public Object valueAt(int rowIndex, String column) {
            if (rowIndex < 0 || rowIndex >= rows.size()) {
                return null;
            }
            return rows.get(rowIndex).get(column);
        }
    }

    public QueryResult execute(ReportDataQuery query, Map<String, Object> parameters) {
        NamedParameterJdbcTemplate template = new NamedParameterJdbcTemplate(dataSource);
        template.getJdbcTemplate().setQueryTimeout(QUERY_TIMEOUT_SECONDS);

        String sql = queryGuard.withRowLimit(query.getStatement(),
                query.getMaxRows() == null ? 5000 : query.getMaxRows());

        MapSqlParameterSource params = new MapSqlParameterSource();
        if (parameters != null) {
            parameters.forEach(params::addValue);
        }

        QueryResult result = new QueryResult();
        template.query(sql, params, rs -> {
            if (result.columns.isEmpty()) {
                int count = rs.getMetaData().getColumnCount();
                for (int i = 1; i <= count; i++) {
                    result.columns.add(rs.getMetaData().getColumnLabel(i));
                }
            }
            Map<String, Object> row = new LinkedHashMap<>();
            for (String column : result.columns) {
                row.put(column, rs.getObject(column));
            }
            result.rows.add(row);
        });

        log.debug("query {} v{} trả về {} dòng", query.getCode(), query.getVersionNo(),
                result.rowCount());
        return result;
    }
}
