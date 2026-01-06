package com.quangnt0000.be_modul.controller;

import com.quangnt0000.be_modul.dto.ReportDTO;
import com.quangnt0000.be_modul.service.ExcelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/excel")
@RequiredArgsConstructor
public class ExcelController {
    private final ExcelService excelService;

    @PostMapping
    public ResponseEntity<?> exportExcel(@RequestBody ReportDTO request) {
        return excelService.exportExcel(request);
    }
}
