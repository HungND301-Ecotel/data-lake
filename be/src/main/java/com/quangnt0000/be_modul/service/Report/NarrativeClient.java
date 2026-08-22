package com.quangnt0000.be_modul.service.Report;

import com.quangnt0000.be_modul.modal.Report.ReportFact;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Gọi worker để sinh phần nhận xét cho báo cáo.
 *
 * <p>Phần AI cố ý không nằm ở backend: worker giữ model registry, quy tắc AI
 * enclave và bộ kiểm chứng số liệu của M09. Đưa việc gọi mô hình về một chỗ
 * nghĩa là quy tắc "AI không tự tạo số liệu" chỉ cần thực thi một lần.
 */
@Slf4j
@Service
public class NarrativeClient {

    private static final Duration TIMEOUT = Duration.ofSeconds(120);

    private final WebClient client;

    public NarrativeClient(@Qualifier("dataLakeWebClient") WebClient client) {
        this.client = client;
    }

    public static class NarrativeResponse {
        public String narrative;
        public List<String> factsUsed = new ArrayList<>();
        public String modelId;
        public String modelVersion;
        public List<String> warnings = new ArrayList<>();
        public boolean blocked;
        public String reason;
    }

    /**
     * @param bearerToken token của người dùng đang thao tác, để worker áp đúng
     *                    clearance của họ thay vì quyền của backend.
     */
    @SuppressWarnings("unchecked")
    public NarrativeResponse generate(List<ReportFact> facts, String instruction,
                                      int securityLevel, String bearerToken) {
        List<Map<String, Object>> factPayload = new ArrayList<>();
        for (ReportFact fact : facts) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("code", fact.getCode());
            item.put("label", fact.getLabel() == null ? fact.getPlaceholderName() : fact.getLabel());
            item.put("value", fact.getValue());
            item.put("unit", fact.getUnit());
            factPayload.add(item);
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("facts", factPayload);
        body.put("instruction", instruction);
        body.put("security_level", securityLevel);

        Map<String, Object> raw = client.post()
                .uri("/api/v1/narrative")
                .headers(headers -> {
                    if (bearerToken != null && !bearerToken.isBlank()) {
                        headers.setBearerAuth(bearerToken);
                    }
                })
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block(TIMEOUT);

        NarrativeResponse response = new NarrativeResponse();
        if (raw == null) {
            response.blocked = true;
            response.reason = "no_response";
            response.warnings.add("Worker không phản hồi");
            return response;
        }

        response.narrative = (String) raw.getOrDefault("narrative", "");
        response.blocked = Boolean.TRUE.equals(raw.get("blocked"));
        response.reason = (String) raw.get("reason");

        Object used = raw.get("facts_used");
        if (used instanceof List<?> list) {
            list.forEach(item -> response.factsUsed.add(String.valueOf(item)));
        }
        Object warnings = raw.get("warnings");
        if (warnings instanceof List<?> list) {
            list.forEach(item -> response.warnings.add(String.valueOf(item)));
        }
        Object model = raw.get("model");
        if (model instanceof Map<?, ?> map) {
            response.modelId = String.valueOf(map.get("model_id"));
            response.modelVersion = String.valueOf(map.get("version"));
        }
        return response;
    }
}
