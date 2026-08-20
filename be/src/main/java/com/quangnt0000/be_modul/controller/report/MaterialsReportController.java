package com.quangnt0000.be_modul.controller.report;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.quangnt0000.be_modul.service.report.MaterialsReportService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/materials-report")
@RequiredArgsConstructor
public class MaterialsReportController {
    private final MaterialsReportService coalReportService;
    
    @GetMapping("/tong-hop-nhap-xuat-ton")
    public ResponseEntity<?> getTongHopReport(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        return ResponseEntity.ok(coalReportService.buildFullReport(year, month));
    }

    @GetMapping("/tieu-thu-than")
    public ResponseEntity<?> getTieuThuReport(
            @RequestParam Integer year,
            @RequestParam Integer month) {
        return ResponseEntity.ok(coalReportService.buildConsumptionReport(year, month));
    }
}
