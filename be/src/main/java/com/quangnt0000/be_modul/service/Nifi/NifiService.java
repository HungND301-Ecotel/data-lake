package com.quangnt0000.be_modul.service.Nifi;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Service
@Slf4j
public class NifiService {
    // private final WebClient nifiWebClient;
    // private volatile String cachedToken;
    // private volatile LocalDateTime tokenExpiry;

    // @Value("${nifi.username}")
    // private String nifiUsername;

    // @Value("${nifi.password}")
    // private String nifiPassword;
    
    // public NifiService(
    //         @Qualifier("nifiWebClient") WebClient webClient) {
    //     this.nifiWebClient = webClient;
    // }

    // public Mono<Map> getProcessGroup(String token, String flowId) {
    //     return nifiWebClient.get()
    //             .uri("/process-groups/{id}", flowId)
    //             .headers(h -> h.setBearerAuth(token))
    //             .retrieve()
    //             .bodyToMono(Map.class);
    // }

    // public Mono<Map> startProcessGroup(String flowId, Long executionId) {
    //     return withToken(token -> getProcessGroup(token, flowId)
    //             .flatMap(pg -> {
    //                 Map revision = (Map) pg.get("revision");
    //                 Map<String, Object> body = Map.of(
    //                         "id", flowId,
    //                         "state", "RUNNING",
    //                         "revision", revision,
    //                         "disconnectedNodeAcknowledged", false);
    //                 return nifiWebClient.put()
    //                         .uri("/flow/process-groups/{id}", flowId)
    //                         .headers(h -> h.setBearerAuth(token))
    //                         .bodyValue(body)
    //                         .retrieve()
    //                         .bodyToMono(Map.class);
    //             }))
    //             .doOnError(e -> log.error("Lỗi khi trigger NiFi flow {}: {}", flowId, e.getMessage()));
    // }

    // public Mono<Map> getProcessGroupStatus(String flowId) {
    //     return withToken(token -> nifiWebClient.get()
    //             .uri("/flow/process-groups/{id}/status", flowId)
    //             .headers(h -> h.setBearerAuth(token))
    //             .retrieve()
    //             .bodyToMono(Map.class));
    // }

    // private Mono<String> getValidToken() {
    //     if (cachedToken != null && LocalDateTime.now().isBefore(tokenExpiry)) {
    //         return Mono.just(cachedToken);
    //     }
    //     return nifiWebClient.post()
    //             .uri("/access/token")
    //             .contentType(MediaType.APPLICATION_FORM_URLENCODED)
    //             .bodyValue("username=" + nifiUsername + "&password=" + nifiPassword)
    //             .retrieve()
    //             .bodyToMono(String.class)
    //             .doOnNext(token -> {
    //                 cachedToken = token;
    //                 tokenExpiry = LocalDateTime.now().plusHours(11); // refresh sớm hơn 1h để an toàn
    //             });
    // }

    // private <T> Mono<T> withToken(Function<String, Mono<T>> action) {
    //     return getValidToken().flatMap(action);
    // }

    public Mono<String> triggerWithExecutionId(Long executionId) {
        Map<String, Object> body = Map.of("executionId", executionId);

        return WebClient.create()
                .post()
                .uri("http://localhost:9090/etl-trigger")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .doOnNext(r -> log.info(
                        "NiFi triggered OK: executionId={}", executionId))
                .doOnError(e -> log.error(
                        "Lỗi trigger NiFi executionId={}: {}",
                        executionId, e.getMessage(), e));
    }
}
