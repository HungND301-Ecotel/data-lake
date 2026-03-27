package com.quangnt0000.be_modul.dto.WareDataRow;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareDataRowSearch {
    @Builder.Default
    private Integer page = 0;
    @Builder.Default
    private Integer limit = 10;
    @Builder.Default
    private String keyword = "";
    @Builder.Default
    private Integer wareBatchId = null;
    @Builder.Default
    private String sort = "ASC";
    @Builder.Default
    private String sortBy = "id";
}
