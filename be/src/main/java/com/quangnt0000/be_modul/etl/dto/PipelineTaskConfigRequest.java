package com.quangnt0000.be_modul.etl.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PipelineTaskConfigRequest {
    @NotNull
    private Long pipelineId;

    // @NotBlank
    private String taskName;

    // @NotBlank
    private String targetDbName;

    @NotBlank
    private String targetTable;

    @NotBlank
    private String targetSchema;

    // @NotBlank
    private String sourceKey;

    @NotNull
    private Long dataSourceId;    

    private String paramsSchema;

    private String sourceSchema;

    private Integer syncParamType;

    private String syncColumn;
}
