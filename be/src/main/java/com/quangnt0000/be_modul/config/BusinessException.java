package com.quangnt0000.be_modul.config;

import org.springframework.http.HttpStatus;

/**
 * Lỗi nghiệp vụ có thông điệp dành cho người dùng cuối.
 *
 * <p>Đây là ranh giới giữa hai loại lỗi: thông điệp của lớp này được trả nguyên
 * văn ra client, còn mọi ngoại lệ khác chỉ nhận một thông điệp chung. Tài liệu
 * mục 8.2 cấm trả stack trace, câu lệnh SQL hay đường dẫn vật lý, mà những thứ
 * đó thường nằm sẵn trong {@code getMessage()} của ngoại lệ hạ tầng.
 */
public class BusinessException extends RuntimeException {

    private final HttpStatus status;

    public BusinessException(String message) {
        this(message, HttpStatus.BAD_REQUEST);
    }

    public BusinessException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    public static BusinessException notFound(String message) {
        return new BusinessException(message, HttpStatus.NOT_FOUND);
    }

    public static BusinessException conflict(String message) {
        return new BusinessException(message, HttpStatus.CONFLICT);
    }

    public HttpStatus getStatus() {
        return status;
    }
}
