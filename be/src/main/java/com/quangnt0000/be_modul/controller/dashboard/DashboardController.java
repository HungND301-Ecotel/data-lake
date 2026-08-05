package com.quangnt0000.be_modul.controller.dashboard;

import java.time.LocalDate;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.quangnt0000.be_modul.service.dashboard.WorkforceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final WorkforceService workforceService;

    @GetMapping("/work-force")
    public ResponseEntity<?> getData(
            @RequestParam("date") LocalDate date,
            @RequestParam(required = false) String configId) {
        return ResponseEntity.ok(workforceService.getWorkForce(date, configId));
    }
}
