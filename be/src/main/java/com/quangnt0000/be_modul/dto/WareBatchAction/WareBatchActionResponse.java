package com.quangnt0000.be_modul.dto.WareBatchAction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareBatchActionResponse {
    private Integer id;

    private String actionName; //Insert-Update

    private String tableName;
    private String burks;
    private Boolean deleted;
    private String requestId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
