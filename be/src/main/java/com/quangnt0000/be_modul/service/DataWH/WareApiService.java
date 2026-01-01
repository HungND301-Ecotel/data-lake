package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.dto.TWH_Auth.LoginRequest;
import com.quangnt0000.be_modul.dto.TWH_Auth.LoginResponse;
import com.quangnt0000.be_modul.dto.TWH_Get.GetRequest;
import com.quangnt0000.be_modul.dto.TWH_Get.GetResponse;
import com.quangnt0000.be_modul.dto.TWH_Push.PushRequest;
import com.quangnt0000.be_modul.dto.TWH_Push.PushResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class WareApiService {

    private final WebClient webClient;

    public ResponseEntity<LoginResponse> login(LoginRequest request) {
        LoginResponse response = webClient.post()
                .uri("/auth/token")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(LoginResponse.class)
                .block();

        return ResponseEntity.ok(response);
    }


    public ResponseEntity<String> health() {
        try {
            return ResponseEntity.ok(
                    webClient.get()
                            .uri("/health")
                            .retrieve()
                            .bodyToMono(String.class)
                            .block()
            );
        } catch (WebClientResponseException ex) {
            return ResponseEntity
                    .status(ex.getStatusCode())
                    .body(ex.getResponseBodyAsString());
        }
    }


    public Mono<ResponseEntity<GetResponse>> getMasterData(GetRequest request) {

        LoginResponse loginResponse = login(LoginRequest.builder()
                .username("VHTC")
                .password("Vin@comin123")
                .ttlSeconds(3600)
                .build()).getBody();
        String token = loginResponse.getAccessToken();
        if (token == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        return webClient.get()
                .uri(uriBuilder -> {
                    var builder = uriBuilder
                            .path("/v1/master-data")
                            .queryParam("table", request.getTable());

                    if (request.getFilters() != null && !request.getFilters().isEmpty()) {
                        builder.queryParam("filters", request.getFilters());
                    }
                    if (request.getColumns() != null && !request.getColumns().isEmpty()) {
                        builder.queryParam("columns", request.getColumns());
                    }
                    if (request.getOrderBy() != null && !request.getOrderBy().isEmpty()) {
                        builder.queryParam("order_by", request.getOrderBy());
                    }
                    if (request.getLimit() != null) {
                        builder.queryParam("limit", request.getLimit());
                    }
                    if (request.getOffset() != null) {
                        builder.queryParam("offset", request.getOffset());
                    }

                    return builder.build();
                })
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .onStatus(
                        HttpStatusCode::isError,
                        r -> r.bodyToMono(String.class)
                                .flatMap(body ->
                                        Mono.error(new RuntimeException("Master error: " + body))
                                )
                )
                .bodyToMono(GetResponse.class)
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    log.error("Get master-data failed", ex);
                    return Mono.just(
                            ResponseEntity
                                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                    .body(null)
                    );
                }
        );
    }

    public Mono<ResponseEntity<PushResponse>> push(@Valid PushRequest request) {

        LoginResponse loginResponse = login(LoginRequest.builder()
                .username("VHTC")
                .password("Vin@comin123")
                .ttlSeconds(3600)
                .build()
        ).getBody();

        if (loginResponse == null || loginResponse.getAccessToken() == null) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }

        String token = loginResponse.getAccessToken();

        return webClient.post()
                .uri("/v1/push-transaction")
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .bodyValue(request)
                .retrieve()
                .onStatus(
                        HttpStatusCode::isError,
                        r -> r.bodyToMono(String.class)
                                .flatMap(body ->
                                        Mono.error(new RuntimeException("Push error: " + body))
                                )
                )
                .bodyToMono(PushResponse.class)
                .map(ResponseEntity::ok)
                .onErrorResume(ex -> {
                    log.error("Push master-data failed", ex);
                    return Mono.just(
                            ResponseEntity
                                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                    .body(null)
                    );
                });
    }

}
