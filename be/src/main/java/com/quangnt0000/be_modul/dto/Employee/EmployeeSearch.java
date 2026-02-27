package com.quangnt0000.be_modul.dto.Employee;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class EmployeeSearch {
    @Builder.Default
    private int page = 0;
    @Builder.Default
    private int limit = 15;
    @Builder.Default
    private String keyword = "";
    @Builder.Default
    private String sort = "DESC";
    @Builder.Default
    private String sortBy = "e.created_at";
    @Builder.Default
    private String departmentId = null;
}
