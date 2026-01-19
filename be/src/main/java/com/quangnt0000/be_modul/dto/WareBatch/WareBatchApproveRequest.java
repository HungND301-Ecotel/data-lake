package com.quangnt0000.be_modul.dto.WareBatch;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request để approve một WareBatch
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareBatchApproveRequest {

    private Integer wareBatchId;
}
