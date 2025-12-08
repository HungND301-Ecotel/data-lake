package com.quangnt0000.be_modul.dto.Employee;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class EmployeeRequest {
    private String id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private LocalDate birthday;
    private String gender;
    private String position;
    private MultipartFile avatarFile;
    private String departmentId;
}
