package com.quangnt0000.be_modul.repository.Iam;

import com.quangnt0000.be_modul.modal.Iam.AuthAuditEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/**
 * Bộ lọc tìm kiếm được dựng bằng Specification trong service thay vì JPQL có
 * nhiều tham số tuỳ chọn, để tránh lỗi suy luận kiểu tham số trên PostgreSQL.
 */
public interface AuthAuditEventRepository
        extends JpaRepository<AuthAuditEvent, String>, JpaSpecificationExecutor<AuthAuditEvent> {
}
