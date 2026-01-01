package com.quangnt0000.be_modul.dto.WareMapping;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareMappingSearch {
    @Builder.Default
    private Integer page = 0;
    @Builder.Default
    private Integer limit = 100;
    @Builder.Default
    private String keyword = "";
    @Builder.Default
    private Integer wareTemplateId = null;
    @Builder.Default
    private String sort = "ASC";
    @Builder.Default
    private String sortBy = "excelColumn";
}
