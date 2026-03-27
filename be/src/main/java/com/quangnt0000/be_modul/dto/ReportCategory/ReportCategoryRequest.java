package com.quangnt0000.be_modul.dto.ReportCategory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class ReportCategoryRequest {
    private String id;
    private String code;
    private String name;
    private String description;
    private String departmentId;
}
