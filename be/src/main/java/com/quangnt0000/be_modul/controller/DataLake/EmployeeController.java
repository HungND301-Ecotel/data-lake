package com.quangnt0000.be_modul.controller.DataLake;

import com.quangnt0000.be_modul.dto.Employee.EmployeeRequest;
import com.quangnt0000.be_modul.dto.Employee.EmployeeSearch;
import com.quangnt0000.be_modul.service.DataLake.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/employee")
@RequiredArgsConstructor
public class EmployeeController {
    private final EmployeeService employeeService;

    @PostMapping
    public ResponseEntity<?> addEmployee(@RequestBody EmployeeRequest request) {
        return employeeService.addEmployee(request);
    }

    @PutMapping
    private ResponseEntity<?> updateEmployee(@ModelAttribute EmployeeRequest request) {
        return employeeService.updateEmployee(request);
    }

    @DeleteMapping("/{employee-id}")
    private ResponseEntity<?> deleteEmployee(@PathVariable ("employee-id") String employeeId) {
        return employeeService.deleteEmployee(employeeId);
    }

    @GetMapping
    public ResponseEntity<?> searchEmployee(EmployeeSearch request) {
        return employeeService.searchEmployee(request);
    }

    @GetMapping("/{employee-id}")
    public ResponseEntity<?> getByEmployeeId(@PathVariable ("employee-id") String employeeId) {
        return employeeService.getByEmployeeId(employeeId);
    }
}
