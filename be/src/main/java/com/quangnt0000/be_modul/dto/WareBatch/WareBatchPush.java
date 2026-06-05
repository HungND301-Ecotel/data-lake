package com.quangnt0000.be_modul.dto.WareBatch;

import com.quangnt0000.be_modul.enums.WareBatchTargetEnum;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareBatchPush {
    private Integer id;
    private Boolean deleteMissing;
    private String username;
    private String password;
    private WareBatchTargetEnum syncTarget;

}
