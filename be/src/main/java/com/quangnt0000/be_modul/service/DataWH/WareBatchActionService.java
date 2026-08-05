package com.quangnt0000.be_modul.service.DataWH;

import com.quangnt0000.be_modul.dto.PageResponse;
import com.quangnt0000.be_modul.dto.WareBatchAction.TimeCountDto;
import com.quangnt0000.be_modul.dto.WareBatchAction.WareBatchActionResponse;
import com.quangnt0000.be_modul.dto.WareBatchAction.WareBatchActionSearch;
import com.quangnt0000.be_modul.modal.DataWH.WareBatchAction;
import com.quangnt0000.be_modul.repository.DataWH.WareBatchActionJdbc;
import com.quangnt0000.be_modul.repository.DataWH.WareBatchActionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WareBatchActionService  {
    private final WareBatchActionRepository wareBatchActionRepository;
    private final WareBatchActionJdbc wareBatchActionJdbc;
    private final com.quangnt0000.be_modul.repository.SyncConnectionConfigRepository configRepository;

    /**
     * Tạo JdbcTemplate động từ SyncConnectionConfig
     */
    private JdbcTemplate createDynamicJdbcTemplate(String configId) {
        com.quangnt0000.be_modul.modal.Data.SyncConnectionConfig config = configRepository.findById(configId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy config với id: " + configId));

        DriverManagerDataSource dataSource = new DriverManagerDataSource();

        String driverClassName;
        String jdbcUrl;
        String databaseType = config.getDatabaseType() != null ? config.getDatabaseType().name() : null;

        if (databaseType == null || databaseType.equalsIgnoreCase("POSTGRES") || databaseType.equalsIgnoreCase("POSTGRESQL")) {
            driverClassName = "org.postgresql.Driver";
            jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", config.getHost(), config.getPort(), config.getDatabaseName());
        } else if (databaseType.equalsIgnoreCase("SQLSERVER")) {
            driverClassName = "com.microsoft.sqlserver.jdbc.SQLServerDriver";
            jdbcUrl = String.format("jdbc:sqlserver://%s:%d;databaseName=%s;encrypt=false;trustServerCertificate=true", config.getHost(), config.getPort(), config.getDatabaseName());
        } else if (databaseType.equalsIgnoreCase("MYSQL")) {
            driverClassName = "com.mysql.cj.jdbc.Driver";
            jdbcUrl = String.format("jdbc:mysql://%s:%d/%s", config.getHost(), config.getPort(), config.getDatabaseName());
        } else {
            driverClassName = "org.postgresql.Driver";
            jdbcUrl = String.format("jdbc:postgresql://%s:%d/%s", config.getHost(), config.getPort(), config.getDatabaseName());
        }

        dataSource.setDriverClassName(driverClassName);
        dataSource.setUrl(jdbcUrl);
        dataSource.setUsername(config.getUsername());
        dataSource.setPassword(config.getPassword());

        return new JdbcTemplate(dataSource);
    }
    public ResponseEntity<?> search(WareBatchActionSearch request) {
        Sort sort = request.getSort().equals("ASC") ? Sort.by(request.getSortBy()).ascending() : Sort.by(request.getSortBy()).descending();
        Pageable pageable = PageRequest.of(request.getPage(), request.getLimit(), sort);
        Page<WareBatchAction> wareBatchActions = wareBatchActionRepository.search(request.getActionName(), request.getTableName(), pageable);
        List<WareBatchActionResponse> wareBatchActionResponses = wareBatchActions.getContent().stream()
                .map(
                        item -> WareBatchActionResponse.builder()
                                .id(item.getId())
                                .actionName(item.getActionName())
                                .tableName(item.getTableName())
                                .createdAt(item.getCreatedAt())
                                .deleted(item.getDeleted())
                                .requestId(item.getRequest().getRequestId())
                                .build()
                )
                .toList();
        PageResponse response = PageResponse.builder()
                .page(request.getPage())
                .limit(request.getLimit())
                .totalElements(wareBatchActions.getSize())
                .totalPages(wareBatchActions.getTotalPages())
                .content(wareBatchActionResponses)
                .build();
        return ResponseEntity.ok(response);
    }

    public ResponseEntity<?> dashboard() {
        return dashboard(null);
    }

    public ResponseEntity<?> dashboard(String configId) {
        JdbcTemplate dynamicTemplate = null;
        if (configId != null && !configId.isBlank()) {
            dynamicTemplate = createDynamicJdbcTemplate(configId);
        }
        Map<String, Object> response = wareBatchActionJdbc.execute(dynamicTemplate);
        return ResponseEntity.ok(response);
    }

    public ResponseEntity<?> cntTime(String time) {
        return cntTime(time, null);
    }

    public ResponseEntity<?> cntTime(String time, String configId) {
        JdbcTemplate dynamicTemplate = null;
        if (configId != null && !configId.isBlank()) {
            dynamicTemplate = createDynamicJdbcTemplate(configId);
        }

        List<TimeCountDto> result;

        switch (time.toUpperCase()) {
            case "DAY" -> result = wareBatchActionJdbc.countByDay(dynamicTemplate);
            case "MONTH" -> result = wareBatchActionJdbc.countByMonth(dynamicTemplate);
            case "YEAR" -> result = wareBatchActionJdbc.countByYear(dynamicTemplate);
            default -> throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "time must be DAY | MONTH | YEAR"
            );
        }

        return ResponseEntity.ok(result);
    }

    public ResponseEntity<?> topTable() {
        return topTable(null);
    }

    public ResponseEntity<?> topTable(String configId) {
        JdbcTemplate dynamicTemplate = null;
        if (configId != null && !configId.isBlank()) {
            dynamicTemplate = createDynamicJdbcTemplate(configId);
        }
        List<TimeCountDto> result = wareBatchActionJdbc.topTable(dynamicTemplate);
        return ResponseEntity.ok(result);
    }
}
