package com.quangnt0000.be_modul.dto.TargetReport;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class DepartmentTargetResponse {
    String departmentId;
    String departmentName;
    LocalDate date;

    @Builder.Default
    List<TargetReportResponse> targetReportResponseList = new ArrayList<>();

    @Builder.Default
    List<DepartmentTargetResponse> children = new ArrayList<>(); // phòng ban con
}
