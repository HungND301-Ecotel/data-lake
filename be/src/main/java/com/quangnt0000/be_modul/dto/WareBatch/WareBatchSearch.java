package com.quangnt0000.be_modul.dto.WareBatch;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareBatchSearch {
    @Builder.Default
    private Integer page = 0;
    @Builder.Default
    private Integer limit = 10;
    @Builder.Default
    private String keyword = null;
    @Builder.Default
    private Integer wareTemplateId = null;
}
