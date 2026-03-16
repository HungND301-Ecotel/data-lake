package com.quangnt0000.be_modul.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ReportDTO {
    private String id;
    private String name;
    private String pageType; //ngang-dọc
    private float marginTop;
    private float marginBottom;
    private float marginLeft;
    private float marginRight;

    private List<ReportItemDTO> items;
}
