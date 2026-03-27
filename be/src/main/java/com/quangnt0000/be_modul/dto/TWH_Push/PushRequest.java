package com.quangnt0000.be_modul.dto.TWH_Push;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
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
public class PushRequest {
    @NotBlank(message = "table is required")
    private String table;

    @JsonProperty("request_id")
    private String requestId;

    @NotEmpty(message = "key_columns is required")
    @JsonProperty("key_columns")
    private List<String> keyColumns;

    @JsonProperty("scope_filter")
    private Map<String, Object> scopeFilter;

    @NotEmpty(message = "rows is required")
    private List<Map<String, Object>> rows;

    @JsonProperty("delete_missing")
    @Builder.Default
    private Boolean deleteMissing = false;

    @JsonProperty("changed_by")
    private String changedBy;

    @JsonProperty("data_upload_id")
    private String dataUploadId;
}
