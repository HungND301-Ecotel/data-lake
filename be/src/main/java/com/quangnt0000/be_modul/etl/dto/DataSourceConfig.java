package com.quangnt0000.be_modul.etl.dto;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DataSourceConfig {
    private Long configId;
    private String jwt;
    private String sourceKey;
    private String sourceDbName;
    private String sourceSql;
    private String host;
    private Integer port;
    private String targetDbName;
    private String targetTable;
    private String targetSchema;
    private String databaseType;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss.SSS")
    private LocalDateTime lastSyncValue;    
    private Integer syncParamType;
    private String syncColumn;
}
