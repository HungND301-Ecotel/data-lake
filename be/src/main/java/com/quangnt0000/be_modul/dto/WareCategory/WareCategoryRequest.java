package com.quangnt0000.be_modul.dto.WareCategory;

import com.quangnt0000.be_modul.enums.ReportType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class WareCategoryRequest {
    private Integer id;
    private String code;
    private String name;
    private String description;
    private ReportType reportType;
    private String departmentId;
}
