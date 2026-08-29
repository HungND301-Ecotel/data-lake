package com.quangnt0000.be_modul.etl.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipelineTaskConfigResponse {
    private Long id;
    private String taskName;
    private String targetDbName;
    private String targetSchema;
    private String targetTable;
    private String sourceKey;
    private String sourceSchema;
    private String paramsSchema;
    private Integer syncParamType;
    private String syncColumn;
    private LocalDateTime lastSyncValue;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // FK info (ẩn password)
    private Long pipelineId;
    private String pipelineName;
    private Long dataSourceId;
    private String dataSourceName;
    private String dataSourceHost;
    private Integer dataSourcePort;
}
