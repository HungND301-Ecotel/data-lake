package com.quangnt0000.be_modul.etl.dto;

import java.util.List;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PipelineTaskConfig {
    private List<DataSourceConfig> sources;
}
