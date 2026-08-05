package com.quangnt0000.be_modul.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardRequest {
    private String departmentId;
    private String reportType;
    private Integer reportYear;
    private Integer reportMonth;
    private Integer reportDay;
    private String configId;
}
