package com.quangnt0000.be_modul.dto.WareTemplate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class TableOption {
    private Integer id;
    private String tableName;
    private String tableCode;
}
