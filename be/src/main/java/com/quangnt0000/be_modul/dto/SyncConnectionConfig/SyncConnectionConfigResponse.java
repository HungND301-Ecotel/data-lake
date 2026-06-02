package com.quangnt0000.be_modul.dto.SyncConnectionConfig;

import com.quangnt0000.be_modul.enums.DatabaseType;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SyncConnectionConfigResponse {

    private String id;
    private String host;
    private String databaseName;
    private Integer port;
    private String username;
    private Integer timeoutSeconds;
    private Boolean active;
    private DatabaseType databaseType;
    private Integer isDeleted;
    private Instant createdDate;
    private String createdBy;
    private String lastModifiedBy;
    private String lastModifiedDate;
}
