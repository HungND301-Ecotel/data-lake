package com.quangnt0000.be_modul.dto.WareDataRow;


import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder

public class WareDataRowResponse {
    private Integer id;
    private Integer wareBatchId;
    private Map<String, Object> data;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
