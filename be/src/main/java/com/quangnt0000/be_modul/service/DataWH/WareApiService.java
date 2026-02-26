package com.quangnt0000.be_modul.service.DataWH;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.quangnt0000.be_modul.dto.DataLake.DataLakeInsertRequest;
import com.quangnt0000.be_modul.dto.TWH_Auth.LoginRequest;
import com.quangnt0000.be_modul.dto.TWH_Auth.LoginResponse;
import com.quangnt0000.be_modul.dto.TWH_Get.GetRequest;
import com.quangnt0000.be_modul.dto.TWH_Get.GetResponse;
import com.quangnt0000.be_modul.dto.TWH_Push.PushRequest;
import com.quangnt0000.be_modul.dto.TWH_Push.PushResponse;
import com.quangnt0000.be_modul.dto.WareBatch.WareBatchPush;
import com.quangnt0000.be_modul.modal.DataWH.WareBatch;
import com.quangnt0000.be_modul.modal.DataWH.WareBatchAction;
import com.quangnt0000.be_modul.modal.DataWH.WareMapping;
import com.quangnt0000.be_modul.modal.DataWH.WareTemplate;
import com.quangnt0000.be_modul.repository.DataWH.WareBatchActionRepository;
import com.quangnt0000.be_modul.repository.DataWH.WareMappingRepository;
import com.quangnt0000.be_modul.repository.DataWH.WareTemplateRepository;
import feign.FeignException;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;
import tools.jackson.databind.ObjectMapper;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class WareApiService {
    @Value("${account.username}")
    private String username;
    @Value("${account.password}")
    private String password;

    private final WareBatchActionRepository wareBatchActionRepository;
    private final WareMappingRepository wareMappingRepository;
    private final WareTemplateRepository wareTemplateRepository;
    private final WebClient webClient;
    private final WebClient dataLakeWebClient;
    private final VinacominApiClient vinacominApiClient;
    private final ObjectMapper objectMapper;

    public WareApiService(
            WareBatchActionRepository wareBatchActionRepository,
            WareMappingRepository wareMappingRepository,
            WareTemplateRepository wareTemplateRepository,
            @Qualifier("vinacominWebClient") WebClient webClient,
            @Qualifier("dataLakeWebClient") WebClient dataLakeWebClient,
            VinacominApiClient vinacominApiClient,
            ObjectMapper objectMapper
    ) {
        this.wareBatchActionRepository = wareBatchActionRepository;
        this.wareMappingRepository = wareMappingRepository;
        this.wareTemplateRepository = wareTemplateRepository;
        this.webClient = webClient;
        this.dataLakeWebClient = dataLakeWebClient;
        this.vinacominApiClient = vinacominApiClient;
        this.objectMapper = objectMapper;
    }

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


    public Mono<ResponseEntity<Object>> insertToDataLake(PushRequest request) {
        DataLakeInsertRequest insertRequest = DataLakeInsertRequest.builder()
                .data(request.getRows())
                .source(request.getTable())
                .build();

        return dataLakeWebClient.post()
                .uri("/api/v1/data/insert")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(insertRequest)
                .retrieve()
                .onStatus(
                        HttpStatusCode::isError,
                        r -> r.bodyToMono(String.class)
                                .flatMap(body ->
                                        Mono.error(new RuntimeException("DataLake insert error: " + body))
                                )
                )
                .bodyToMono(Object.class)
                .map(response -> ResponseEntity.ok((Object) response))
                .onErrorResume(ex -> {
                    log.error("DataLake insert failed", ex);
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
            // Transform fieldName to fieldTitle based on table name
            if (request.getTable() != null && response.getRows() != null) {
                // Find WareTemplate by table code
                Optional<WareTemplate> optionalTemplate = wareTemplateRepository.findFirstByTableCodeOrderByCreatedAtDesc(request.getTable());
                
                if (optionalTemplate.isPresent()) {
                    WareTemplate wareTemplate = optionalTemplate.get();
                    List<WareMapping> mappings = wareMappingRepository.findByWareTemplate_IdOrderByIdAsc(wareTemplate.getId());
                    
                    if (!mappings.isEmpty()) {
                        // Create a map of fieldName (lowercase) -> WareMapping for lookup
                        Map<String, WareMapping> fieldNameToMappingMap = mappings.stream()
                                .collect(Collectors.toMap(
                                        mapping -> mapping.getFieldName().toLowerCase(),
                                        mapping -> mapping,
                                        (existing, replacement) -> existing
                                ));
                        
                        // Transform each row - maintain order based on mappings
                        List<Map<String, Object>> transformedRows = response.getRows().stream()
                                .map(row -> {
                                    Map<String, Object> transformedRow = new LinkedHashMap<>();
                                    
                                    // First, add fields in the order of mappings
                                    for (WareMapping mapping : mappings) {
                                        String fieldNameLower = mapping.getFieldName().toLowerCase();
                                        // Find the key in row that matches (case-insensitive)
                                        for (Map.Entry<String, Object> entry : row.entrySet()) {
                                            if (entry.getKey().toLowerCase().equals(fieldNameLower)) {
                                                // Use fieldTitle if not null, otherwise use original fieldName
                                                String key = mapping.getFieldTitle() != null && !mapping.getFieldTitle().isEmpty() 
                                                    ? mapping.getFieldTitle() 
                                                    : mapping.getFieldName();
                                                transformedRow.put(key, entry.getValue());
                                                break;
                                            }
                                        }
                                    }
                                    
                                    // Then, add any remaining fields that weren't in mappings
                                    row.forEach((key, value) -> {
                                        if (!fieldNameToMappingMap.containsKey(key.toLowerCase())) {
                                            transformedRow.put(key, value);
                                        }
                                    });
                                    
                                    return transformedRow;
                                })
                                .collect(Collectors.toList());
                        
                        response.setRows(transformedRows);
                    }
                }
            }

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
