package com.quangnt0000.be_modul.dto.WareBatchAction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareBatchActionSearch {
    @Builder.Default
    private Integer page = 0;
    @Builder.Default
    private Integer limit = 10;
    @Builder.Default
    private String actionName = "";
    @Builder.Default
    private String tableName = "";

    @Builder.Default
    private String sortBy = "id";
    @Builder.Default
    private String sort = "DESC";
}
