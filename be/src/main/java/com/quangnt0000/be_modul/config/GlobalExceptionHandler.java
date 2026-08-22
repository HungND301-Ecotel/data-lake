package com.quangnt0000.be_modul.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.UUID;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Từ chối phân quyền phải trả 403, không phải 500.
     *
     * <p>Handler bắt {@code Exception} bên dưới sẽ nuốt cả
     * {@code AuthorizationDeniedException} do {@code @PreAuthorize} ném ra, nên
     * hai handler này phải được khai báo tường minh. Thông điệp giữ chung chung
     * để không tiết lộ quyền nào còn thiếu (mục 8.2).
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex) {
        log.warn("Từ chối truy cập: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("message", "Bạn không có quyền thực hiện thao tác này"));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, String>> handleAuthentication(AuthenticationException ex) {
        log.warn("Xác thực thất bại: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "Chưa xác thực hoặc phiên đã hết hạn"));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, String>> handleResponseStatusException(ResponseStatusException ex) {
        Map<String, String> body = new HashMap<>();
        body.put("message", ex.getReason());
        return ResponseEntity.status(ex.getStatusCode().value()).body(body);
    }

    /** Lỗi nghiệp vụ: thông điệp do lập trình viên viết cho người dùng đọc. */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, String>> handleBusiness(BusinessException ex) {
        return ResponseEntity.status(ex.getStatus())
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("message", ex.getMessage()));
    }

    /**
     * Lỗi ngoài dự kiến. Thông điệp gốc chỉ đi vào log, không ra client, vì nó
     * có thể chứa câu lệnh SQL, đường dẫn hoặc tên lớp nội bộ (mục 8.2).
     *
     * <p>Trả kèm {@code correlationId} để người dùng báo lại một mã tra cứu
     * được, thay vì phải chép nguyên thông điệp kỹ thuật.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleAllExceptions(Exception ex) {
        String correlationId = UUID.randomUUID().toString().substring(0, 12);
        log.error("Lỗi không xử lý được [{}]", correlationId, ex);

        Map<String, String> body = new HashMap<>();
        body.put("message", "Lỗi hệ thống, vui lòng thử lại hoặc báo mã tra cứu bên dưới");
        body.put("correlationId", correlationId);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }


    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        Map<String, String> body = new HashMap<>();
        String message = "Lỗi dữ liệu";

        if (ex.getRootCause() != null && ex.getRootCause().getMessage().contains("duplicate key")) {
            message = "Mã danh mục đã tồn tại";
        }

        body.put("message", message);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}



