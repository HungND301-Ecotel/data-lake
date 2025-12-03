package com.quangnt0000.be_modul.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class FieldDTO {
    private String id;
    private String alias;
    private String fieldKey;
    private String dataType;
    private float weight;
    private boolean visible;
    private int index;
    private String groupName;
}
