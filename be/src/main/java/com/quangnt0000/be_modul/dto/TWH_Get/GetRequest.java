package com.quangnt0000.be_modul.dto.TWH_Get;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GetRequest {
    @NotBlank(message = "table is required")
    private String table;

    private Map<String, Object> filters;

    private List<String> columns;

    @JsonProperty("order_by")
    private List<String> orderBy;

    private Integer limit;

    private Integer offset;
}
