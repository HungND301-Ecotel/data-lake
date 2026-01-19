package com.quangnt0000.be_modul.dto.WareBatch;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request để reject một WareBatch
 */
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareBatchRejectRequest {
    /**
     * ID của WareBatch cần reject
     */
    private Integer wareBatchId;
}
