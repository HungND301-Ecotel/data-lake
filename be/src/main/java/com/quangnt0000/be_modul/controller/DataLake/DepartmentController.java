package com.quangnt0000.be_modul.controller.DataLake;

import com.quangnt0000.be_modul.dto.Department.DepartmentRequest;
import com.quangnt0000.be_modul.dto.Department.DepartmentSearch;
import com.quangnt0000.be_modul.service.DataLake.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/department")
@RequiredArgsConstructor
public class DepartmentController {
    private final DepartmentService departmentService;

    @PostMapping
    public ResponseEntity<?> saveDepartment(@RequestBody DepartmentRequest request) {
        return departmentService.saveDepartment(request);
    }

    @DeleteMapping("/{department-id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable ("department-id") String departmentId) {
        return departmentService.deleteDepartment(departmentId);
    }

    @GetMapping("/{department-id}")
    public ResponseEntity<?> getDepartmentById(@PathVariable ("department-id") String departmentId) {
        return departmentService.getDepartmentById(departmentId);
    }

    @GetMapping
    public ResponseEntity<?> searchDepartment(@ModelAttribute DepartmentSearch request) {
        return departmentService.searchDepartment(request);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyDepartment(@ModelAttribute DepartmentSearch request) {
        return departmentService.getMyDepartment(request);
    }
}
