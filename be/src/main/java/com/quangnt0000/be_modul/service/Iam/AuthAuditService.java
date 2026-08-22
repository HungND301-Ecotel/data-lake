package com.quangnt0000.be_modul.service.Iam;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.quangnt0000.be_modul.modal.Iam.AuthAuditEvent;
import com.quangnt0000.be_modul.repository.Iam.AuthAuditEventRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Ghi nhật ký kiểm toán danh tính - tài liệu mục 9.3.
 *
 * <p>Ghi trên giao dịch riêng ({@code REQUIRES_NEW}) để sự kiện từ chối vẫn còn
 * sau khi giao dịch nghiệp vụ bị rollback. Việc ghi audit không bao giờ được
 * làm hỏng luồng chính, nên mọi lỗi ở đây chỉ được log lại.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthAuditService {

    public static final String SUCCESS = "SUCCESS";
    public static final String DENIED = "DENIED";
    public static final String FAILURE = "FAILURE";

    /** Khoá không bao giờ được ghi nguyên văn vào audit. */
    private static final Set<String> REDACTED = Set.of(
            "password", "newpassword", "oldpassword", "token", "secret",
            "clientsecret", "authorization", "mfacode", "code");

    private final AuthAuditEventRepository repository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String actor, String actorOrg, String action, String resourceType,
                       String resourceId, String result, String policyDecision,
                       Map<String, Object> details) {
        try {
            repository.save(AuthAuditEvent.builder()
                    .actor(actor == null ? "anonymous" : actor)
                    .actorOrg(actorOrg)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .result(result)
                    .policyDecision(policyDecision)
                    .sourceIp(clientIp())
                    .correlationId(correlationId())
                    .details(sanitize(details))
                    .build());
        } catch (Exception e) {
            log.error("Không ghi được audit cho hành động {}", action, e);
        }
    }

    public void success(String actor, String action, String resourceType, String resourceId,
                        Map<String, Object> details) {
        record(actor, null, action, resourceType, resourceId, SUCCESS, null, details);
    }

    public void denied(String actor, String action, String resourceType, String resourceId,
                       String reason) {
        record(actor, null, action, resourceType, resourceId, DENIED, reason, null);
    }

    public void failure(String actor, String action, String resourceType, String resourceId,
                        String reason) {
        record(actor, null, action, resourceType, resourceId, FAILURE, reason, null);
    }

    private String sanitize(Map<String, Object> details) {
        if (details == null || details.isEmpty()) {
            return null;
        }
        Map<String, Object> safe = new LinkedHashMap<>();
        details.forEach((key, value) -> {
            if (key != null && REDACTED.contains(key.toLowerCase())) {
                safe.put(key, "[REDACTED]");
            } else {
                safe.put(key, value);
            }
        });
        try {
            return objectMapper.writeValueAsString(safe);
        } catch (Exception e) {
            return null;
        }
    }

    private HttpServletRequest currentRequest() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            return attrs.getRequest();
        }
        return null;
    }

    private String clientIp() {
        HttpServletRequest request = currentRequest();
        if (request == null) {
            return null;
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String correlationId() {
        HttpServletRequest request = currentRequest();
        return request == null ? null : request.getHeader("X-Correlation-Id");
    }
}
