package com.quangnt0000.be_modul.service.DataWH;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.quangnt0000.be_modul.dto.TWH_Auth.LoginRequest;
import com.quangnt0000.be_modul.dto.TWH_Auth.LoginResponse;
import com.quangnt0000.be_modul.dto.TWH_Get.GetRequest;
import com.quangnt0000.be_modul.dto.TWH_Get.GetResponse;
import com.quangnt0000.be_modul.dto.TWH_Push.PushRequest;
import com.quangnt0000.be_modul.dto.TWH_Push.PushResponse;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchPush;
import com.quangnt0000.be_modul.modal.DataWH.WareBatch;
import com.quangnt0000.be_modul.modal.DataWH.WareBatchAction;
import com.quangnt0000.be_modul.repository.DataWH.WareBatchActionRepository;
import feign.FeignException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import tools.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
@Slf4j
public class WareApiService {
    @Value("${account.username}")
    private String username;
    @Value("${account.password}")
    private String password;

    private final WareBatchActionRepository wareBatchActionRepository;
    private final WebClient webClient;
    private final VinacominApiClient vinacominApiClient;
    private final ObjectMapper objectMapper;

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
        ObjectMapper mapper = new ObjectMapper();
        LoginResponse loginResponse = login(LoginRequest.builder()
                .username(username)
                .password(password)
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
                        String filtersJson = mapper.writeValueAsString(request.getFilters());
                        builder.queryParam("filters", filtersJson); // **KHÔNG build(true)**
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

    public Mono<ResponseEntity<Object>> push(@Valid PushRequest request, WareBatch wareBatch, WareBatchPush batchPush) {



        LoginResponse loginResponse = login(LoginRequest.builder()
                .username(batchPush.getUsername())
                .password(batchPush.getPassword())
                .ttlSeconds(3600)
                .build()
        ).getBody();

        if (loginResponse == null || loginResponse.getAccessToken() == null) {
//            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Sai thông tin tài khoản"));
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sai thông tin tài khoản");
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

                .flatMap(pushResponse ->
                        Mono.fromCallable(() -> {
                                    wareBatchActionRepository.save(
                                            WareBatchAction.builder()
                                                    .action("PUSH")
                                                    .request(request)
                                                    .response(pushResponse)
                                                    .actionName(pushResponse.getInserted() > 0 ? "Insert" : "Update")
                                                    .inserted(pushResponse.getInserted())
                                                    .updated(pushResponse.getUpdated())
                                                    .tableName(request.getTable())
                                                    .wareBatch(wareBatch)
                                                    .build()
                                    );
                                    return ResponseEntity.ok((Object) pushResponse);
                                }
                        ).subscribeOn(Schedulers.boundedElastic())
                )

                .onErrorResume(ex -> {
                    log.error("Push master-data failed", ex);
                    return Mono.just(
                            ResponseEntity
                                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                                    .contentType(MediaType.TEXT_PLAIN)
                                    .body(ex.getMessage())
                    );
                });
    }


    public ResponseEntity<Object> get(@Valid GetRequest request) {
        try {
            LoginResponse loginResponse = login(LoginRequest.builder()
                    .username(username)
                    .password(password)
                    .ttlSeconds(3600)
                    .build()).getBody();
            String token = loginResponse.getAccessToken();
            String filtersJson;
            if (request.getFilters() == null || request.getFilters().isEmpty()) {
                filtersJson = null;
            } else {
                filtersJson = objectMapper.writeValueAsString(request.getFilters());
            }

            GetResponse response = vinacominApiClient.getMasterData(
                    request.getTable(),
                    filtersJson,
                    request.getColumns(),
                    request.getOrderBy(),
                    request.getLimit(),
                    request.getOffset(),
                    "Bearer " + token
            );

            return ResponseEntity.ok(response);

        } catch (FeignException.BadRequest ex) {
            log.error("API 400 Bad Request: {}", ex.contentUTF8(), ex);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(null);
        } catch (Exception ex) {
            log.error("Get master-data failed", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }

    }
}
