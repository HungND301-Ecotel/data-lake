package com.quangnt0000.be_modul.service.Report;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Kiểm tra câu lệnh trước khi cho phép lưu vào danh mục truy vấn - mục 6.4
 * ("tham số hoá query, giới hạn row/time/bytes").
 *
 * <p>Đây là kiểm tra ở thời điểm khai báo, không phải thời điểm chạy: một câu
 * lệnh không qua được kiểm tra thì không bao giờ vào được danh mục, nên không
 * có đường nào để nó chạy. Kết hợp với kết nối chỉ đọc ở tầng thực thi.
 */
@Component
public class QueryGuard {

    /** Từ khoá làm thay đổi dữ liệu hoặc lược đồ. */
    private static final List<String> FORBIDDEN = List.of(
            "insert", "update", "delete", "merge", "truncate", "drop", "alter",
            "create", "grant", "revoke", "call", "do", "copy", "vacuum",
            "pg_read_file", "pg_sleep", "lo_import", "lo_export", "dblink");

    private static final Pattern WORD = Pattern.compile("\\b(%s)\\b"
            .formatted(String.join("|", FORBIDDEN)), Pattern.CASE_INSENSITIVE);

    /** Bình luận có thể dùng để giấu câu lệnh thứ hai. */
    private static final Pattern COMMENT = Pattern.compile("(--|/\\*|\\*/)");

    public static class Violation extends RuntimeException {
        public Violation(String message) {
            super(message);
        }
    }

    /**
     * Ném {@link Violation} khi câu lệnh không an toàn. Trả về câu lệnh đã cắt
     * khoảng trắng thừa khi hợp lệ.
     */
    public String validate(String statement) {
        if (statement == null || statement.isBlank()) {
            throw new Violation("Câu lệnh trống");
        }

        String trimmed = statement.trim();
        // Bỏ dấu chấm phẩy cuối câu, nhưng không cho phép nhiều câu lệnh.
        while (trimmed.endsWith(";")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1).trim();
        }
        if (trimmed.contains(";")) {
            throw new Violation("Chỉ cho phép một câu lệnh duy nhất");
        }

        String lower = trimmed.toLowerCase(Locale.ROOT);
        if (!lower.startsWith("select") && !lower.startsWith("with")) {
            throw new Violation("Chỉ cho phép câu lệnh SELECT hoặc WITH");
        }
        if (COMMENT.matcher(trimmed).find()) {
            throw new Violation("Không cho phép bình luận trong câu lệnh");
        }
        if (WORD.matcher(lower).find()) {
            throw new Violation("Câu lệnh chứa từ khoá không được phép");
        }
        return trimmed;
    }

    /** Bọc câu lệnh trong LIMIT để một truy vấn khai báo sai không kéo cả bảng. */
    public String withRowLimit(String statement, int maxRows) {
        int limit = Math.max(1, Math.min(maxRows, 100000));
        return "select * from (%s) as guarded_query limit %d".formatted(statement, limit);
    }
}
