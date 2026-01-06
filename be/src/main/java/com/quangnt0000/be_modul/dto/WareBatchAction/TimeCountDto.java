package com.quangnt0000.be_modul.dto.WareBatchAction;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TimeCountDto {
    private String label; // ngày / tháng / năm
    private Long total;
}
