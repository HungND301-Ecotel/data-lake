package com.quangnt0000.be_modul.service.dashboard;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.stereotype.Service;

import com.quangnt0000.be_modul.dto.dashboard.WorkforceResponse;
import com.quangnt0000.be_modul.modal.Data.SyncConnectionConfig;
import com.quangnt0000.be_modul.repository.SyncConnectionConfigRepository;
import com.quangnt0000.be_modul.repository.dashboard.WorkForceRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorkforceService {
    private final WorkForceRepository workForceRepository;
    private final SyncConnectionConfigRepository configRepository;

    public List<WorkforceResponse> getWorkForce(LocalDate date, String configId) {
        // Nếu không có configId, trả về danh sách rỗng
        if (configId == null || configId.isBlank()) {
            log.info("Không có configId được chọn, trả về dữ liệu rỗng");
            return new ArrayList<>();
        }

        try {
            SyncConnectionConfig config = configRepository.findById(configId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy config với id: " + configId));
            JdbcTemplate dynamicTemplate = createDynamicJdbcTemplate(config);
            return workForceRepository.getWorkForce(date, dynamicTemplate);
        } catch (Exception e) {
            log.error("Lỗi khi truy vấn database với configId={}: {}", configId, e.getMessage());
            throw e;
        }
    }

    private JdbcTemplate createDynamicJdbcTemplate(SyncConnectionConfig config) {
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
}
