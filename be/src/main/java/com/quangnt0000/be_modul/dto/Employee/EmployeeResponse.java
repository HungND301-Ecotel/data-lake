package com.quangnt0000.be_modul.dto.Employee;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class EmployeeResponse {
    private String id;
    private String name;
    private List<DepartmentInfo> departments;
    private String position;
    private String phone;
    private String email;
    private String address;
    private String gender;
    private String birthday;
    private String keyAvatar;
    private String role;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DepartmentInfo {
        private String id;
        private String name;
    }
}
