package com.quangnt0000.be_modul.service.DataLake;

import com.quangnt0000.be_modul.dto.Employee.EmployeeRequest;
import com.quangnt0000.be_modul.dto.Employee.EmployeeResponse;
import com.quangnt0000.be_modul.dto.Employee.EmployeeSearch;
import com.quangnt0000.be_modul.dto.FileResponse;
import com.quangnt0000.be_modul.dto.PageResponse;
import com.quangnt0000.be_modul.modal.DataLake.Department;
import com.quangnt0000.be_modul.modal.DataLake.Employee;
import com.quangnt0000.be_modul.modal.DataLake.User;
import com.quangnt0000.be_modul.repository.DataLake.DepartmentRepository;
import com.quangnt0000.be_modul.repository.DataLake.EmployeeJdbc;
import com.quangnt0000.be_modul.repository.DataLake.EmployeeRepository;
import com.quangnt0000.be_modul.repository.DataLake.UserRepository;
import com.quangnt0000.be_modul.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final EmployeeJdbc employeeJdbc;
    private final DepartmentRepository departmentRepository;
    private final S3Service s3Service;
    private final UserRepository userRepository;
    public ResponseEntity<?> addEmployee(EmployeeRequest request) {
        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));

        Employee employee = Employee.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .birthday(request.getBirthday())
                .gender(request.getGender())
                .position(request.getPosition())
                .department(department)
                .build();
        employee = employeeRepository.save(employee);
        return ResponseEntity.ok(employee.getId());
    }

    public ResponseEntity<?> updateEmployee(EmployeeRequest request) {
        Employee employee = employeeRepository.findByIdAndDeletedFalse(request.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        if( request.getDepartmentId()!=null && (employee.getDepartment() == null || !employee.getDepartment().getId().equals(request.getDepartmentId()))) {
            Department department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
            employee.setDepartment(department);
        }
        employee.setName(request.getName());
        employee.setEmail(request.getEmail());
        employee.setPhone(request.getPhone());
        employee.setAddress(request.getAddress());
        employee.setBirthday(request.getBirthday());
        employee.setGender(request.getGender());
        employee.setPosition(request.getPosition());
        if (request.getAvatarFile() != null) {
            FileResponse fileResponse = s3Service.uploadFile("employee-avatar", request.getAvatarFile());
            if (employee.getKeyAvatar() != null && !employee.getKeyAvatar().isEmpty()) {
                s3Service.deleteFile(employee.getKeyAvatar().replace("/", "*"));
            }
            employee.setKeyAvatar(fileResponse.getKey());
        }
        employeeRepository.save(employee);
        return ResponseEntity.ok(employee.getId());
    }

    public ResponseEntity<?> deleteEmployee(String employeeId) {
        Employee employee = employeeRepository.findByIdAndDeletedFalse(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        employee.setDeleted(true);
        employeeRepository.save(employee);
        return ResponseEntity.ok("Deleted");
    }

    public ResponseEntity<?> searchEmployee(EmployeeSearch request) {
        List<EmployeeResponse> employees = employeeJdbc.search(request);
        PageResponse response = PageResponse.builder()
                .page(request.getPage())
                .limit(request.getLimit())
                .totalElements(employees.size())
                .totalPages(employeeJdbc.countFilter(request) / request.getLimit())
                .content(employees)
                .build();
        return ResponseEntity.ok(response);
    }

    public ResponseEntity<?> getByEmployeeId(String employeeId) {
        Employee employee = employeeRepository.findByIdAndDeletedFalse(employeeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Employee not found"));
        EmployeeResponse employeeResponse = EmployeeResponse.builder()
                .id(employee.getId())
                .name(employee.getName())
                .departmentId(employee.getDepartment().getId())
                .departmentName(employee.getDepartment().getName())
                .position(employee.getPosition())
                .phone(employee.getPhone())
                .email(employee.getEmail())
                .address(employee.getAddress())
                .gender(employee.getGender())
                .birthday(employee.getBirthday().toString())
                .keyAvatar(employee.getKeyAvatar())
                .build();
        User user = userRepository.findByEmployee_Id(employeeId).orElse(null);
        employeeResponse.setRole(user != null ? user.getRole() : null);
        return ResponseEntity.ok(employeeResponse);
    }
}
