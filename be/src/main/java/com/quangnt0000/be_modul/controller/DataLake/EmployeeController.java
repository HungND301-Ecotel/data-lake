package com.quangnt0000.be_modul.controller.DataLake;

import com.quangnt0000.be_modul.dto.Employee.EmployeeRequest;
import com.quangnt0000.be_modul.dto.Employee.EmployeeSearch;
import com.quangnt0000.be_modul.modal.DataLake.Employee;
import com.quangnt0000.be_modul.modal.DataLake.User;
import com.quangnt0000.be_modul.repository.DataLake.EmployeeRepository;
import com.quangnt0000.be_modul.repository.DataLake.UserRepository;
import com.quangnt0000.be_modul.service.DataLake.EmployeeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/employee")
@RequiredArgsConstructor
public class EmployeeController {
    private final EmployeeService employeeService;
    private final UserRepository userRepository;
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

    @GetMapping("/my-profile")
    public ResponseEntity<?> getMyProfile() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return employeeService.getByEmployeeId(user.getEmployee().getId());
    }
}
