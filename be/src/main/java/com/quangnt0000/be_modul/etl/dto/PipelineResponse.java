package com.quangnt0000.be_modul.etl.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class PipelineResponse {
    private Long id;
    private String pipelineName;
    private String description;
    private String currentStatus;
    private LocalDateTime lastRunAt;
}
