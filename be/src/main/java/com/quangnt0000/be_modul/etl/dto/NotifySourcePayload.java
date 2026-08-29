package com.quangnt0000.be_modul.etl.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotifySourcePayload {
    private Long configId;
    private String status;        // SUCCESS / ERROR
    private Integer rowCount;
    private String maxSyncValue;
    private String errorMessage;
}
