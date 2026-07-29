package com.quangnt0000.be_modul.service.DataLake;

import com.quangnt0000.be_modul.dto.Department.DepartmentRequest;
import com.quangnt0000.be_modul.dto.Department.DepartmentResponse;
import com.quangnt0000.be_modul.dto.Department.DepartmentSearch;
import com.quangnt0000.be_modul.dto.PageResponse;
import com.quangnt0000.be_modul.modal.DataLake.Department;
import com.quangnt0000.be_modul.modal.DataLake.Employee;
import com.quangnt0000.be_modul.modal.DataLake.User;
import com.quangnt0000.be_modul.repository.DataLake.DepartmentRepository;
import com.quangnt0000.be_modul.repository.DataLake.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class DepartmentService {
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    public ResponseEntity<?> saveDepartment(DepartmentRequest request) {
        // Check for duplicate code
        Optional<Department> existingOpt = departmentRepository.findByCode(request.getCode());
        if (existingOpt.isPresent()) {
            Department existing = existingOpt.get();
            if (request.getId() == null || !existing.getId().equals(request.getId())) {
                if (!existing.getDeleted()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã phòng ban đã tồn tại");
                } else {
                    // Rename the code of the soft-deleted department to free up the unique constraint
                    existing.setCode(existing.getCode() + "_deleted_" + System.currentTimeMillis());
                    departmentRepository.save(existing);
                }
            }
        }

        Department department;

        if (request.getId() != null) {
            department = departmentRepository.findById(request.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
        } else {
            department = new Department();
        }

        department.setCode(request.getCode());
        department.setName(request.getName());
        department.setDescription(request.getDescription());

        department = departmentRepository.save(department);
        return ResponseEntity.ok(department.getId());
    }


    public ResponseEntity<?> deleteDepartment(String departmentId) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
        department.setDeleted(true);
        department.setCode(department.getCode() + "_deleted_" + System.currentTimeMillis());
        departmentRepository.save(department);
        return ResponseEntity.ok("Success");
    }

    public ResponseEntity<?> getDepartmentById(String departmentId) {
        Department department = departmentRepository.findByIdAndDeletedFalse(departmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Department not found"));
        DepartmentResponse response = DepartmentResponse.builder()
                .id(department.getId())
                .code(department.getCode())
                .name(department.getName())
                .description(department.getDescription())
                .build();
        return ResponseEntity.ok(response);
    }

    public ResponseEntity<?> searchDepartment(DepartmentSearch request) {
        Sort sort = request.getSort().equals("ASC") ? Sort.by(Sort.Direction.ASC, request.getSortBy()) : Sort.by(Sort.Direction.DESC, request.getSort());
        Pageable pageable = PageRequest.of(request.getPage(), request.getLimit(), sort);
        Page<Department> departments = departmentRepository.search(request.getKeyword(), pageable);
        List<DepartmentResponse> departmentResponses = departments.getContent().stream().map(
                department -> DepartmentResponse.builder()
                        .id(department.getId())
                        .code(department.getCode())
                        .name(department.getName())
                        .description(department.getDescription())
                        .build()
        ).toList();
        PageResponse response = PageResponse.builder()
                .page(request.getPage())
                .limit(request.getLimit())
                .totalElements((int) departments.getTotalElements())
                .totalPages(departments.getTotalPages())
                .content(departmentResponses)
                .build();
        return ResponseEntity.ok(response);
    }

    public ResponseEntity<?> getMyDepartment(DepartmentSearch request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assert auth != null;
        Jwt jwt = (Jwt) auth.getPrincipal();
        assert jwt != null;
        String role = jwt.getClaimAsString("role");
        String userId = jwt.getClaimAsString("sub");
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        Employee employee = user.getEmployee();
        List<DepartmentResponse> departmentResponses = new ArrayList<>();

        if (role.equals("ADMIN")) {
            return ResponseEntity.ok(searchDepartment(request).getBody());
        }
        if (role.equals("USER") || role.equals("MANAGER")) {
             List<Department> departments = employee.getDepartments();
             if (departments != null) {
                 for (Department department : departments) {
                 departmentResponses.add(DepartmentResponse.builder()
                         .id(department.getId())
                         .name(department.getName())
                         .code(department.getCode())
                         .description(department.getDescription())
                         .build());
                 }
             }
             return ResponseEntity.ok(
                     PageResponse.builder()
                             .page(request.getPage())
                             .limit(request.getLimit())
                             .totalPages(1)
                             .totalElements(departmentResponses.size())
                             .content(departmentResponses)
                             .build()
             );
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Lỗi tải phòng ban");
    }
}
